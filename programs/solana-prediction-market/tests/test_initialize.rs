use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_clock::Clock,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_prediction_market::state::{Category, Market, MarketAuthority, Position},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

const AUTHORITY_SEED: &[u8] = b"authority";
const MARKET_SEED: &[u8] = b"market";
const POSITION_SEED: &[u8] = b"position";
const VAULT_SEED: &[u8] = b"vault";

const MARKET_ID: u64 = 1;
const FEE_RATE_BPS: u16 = 500; // 5%
const BET_AMOUNT: u64 = 1_000_000_000; // 1 SOL
const POSITION_INDEX: u64 = 0;

fn send_ix(svm: &mut LiteSVM, ix: Instruction, signer: &Keypair) {
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&signer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[signer]).unwrap();
    svm.send_transaction(tx).unwrap();
}

fn set_unix_timestamp(svm: &mut LiteSVM, unix_timestamp: i64) {
    let mut clock = svm.get_sysvar::<Clock>();
    clock.unix_timestamp = unix_timestamp;
    svm.set_sysvar::<Clock>(&clock);
}

#[test]
fn test_prediction_market_flow() {
    let program_id = solana_prediction_market::id();
    let admin = Keypair::new();
    let user = Keypair::new();

    let market_authority = Pubkey::find_program_address(&[AUTHORITY_SEED], &program_id).0;
    let market = Pubkey::find_program_address(
        &[MARKET_SEED, MARKET_ID.to_le_bytes().as_ref()],
        &program_id,
    )
    .0;
    let position = Pubkey::find_program_address(
        &[
            POSITION_SEED,
            market.as_ref(),
            user.pubkey().as_ref(),
            POSITION_INDEX.to_le_bytes().as_ref(),
        ],
        &program_id,
    )
    .0;
    let vault = Pubkey::find_program_address(&[VAULT_SEED, market.as_ref()], &program_id).0;

    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/solana_prediction_market.so"
    ));
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&admin.pubkey(), 10_000_000_000).unwrap();
    svm.airdrop(&user.pubkey(), 10_000_000_000).unwrap();

    let start_time: i64 = 1_000;
    let end_time: i64 = 2_000;
    set_unix_timestamp(&mut svm, start_time);

    // 1. initialize MarketAuthority
    let ix = Instruction::new_with_bytes(
        program_id,
        &solana_prediction_market::instruction::Initialize {
            admin: admin.pubkey(),
            fee_rate: FEE_RATE_BPS,
        }
        .data(),
        solana_prediction_market::accounts::Initialize {
            payer: admin.pubkey(),
            market_authority,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    send_ix(&mut svm, ix, &admin);

    let account = svm.get_account(&market_authority).unwrap();
    let mut data: &[u8] = &account.data;
    let authority_state = MarketAuthority::try_deserialize(&mut data).unwrap();
    assert_eq!(authority_state.admin, admin.pubkey());
    assert_eq!(authority_state.fee_rate, FEE_RATE_BPS);

    // 2. create_market (Weather category, 2 options)
    let options = vec!["Yes".to_string(), "No".to_string()];
    let ix = Instruction::new_with_bytes(
        program_id,
        &solana_prediction_market::instruction::CreateMarket {
            market_id: MARKET_ID,
            category: Category::Weather,
            title: "Will it rain tomorrow?".to_string(),
            description: "Resolves YES if measurable rain falls at the reference station."
                .to_string(),
            options: options.clone(),
            start_time,
            end_time,
        }
        .data(),
        solana_prediction_market::accounts::CreateMarket {
            admin: admin.pubkey(),
            market_authority,
            market,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    send_ix(&mut svm, ix, &admin);

    let account = svm.get_account(&market).unwrap();
    let mut data: &[u8] = &account.data;
    let market_state = Market::try_deserialize(&mut data).unwrap();
    assert_eq!(market_state.market_id, MARKET_ID);
    assert_eq!(market_state.category, Category::Weather);
    assert_eq!(market_state.options, options);
    assert!(!market_state.resolved);
    assert_eq!(market_state.total_pool, 0);

    // 3. place_bet on option 0
    set_unix_timestamp(&mut svm, start_time + 500);

    let ix = Instruction::new_with_bytes(
        program_id,
        &solana_prediction_market::instruction::PlaceBet {
            option_index: 0,
            amount: BET_AMOUNT,
            position_index: POSITION_INDEX,
        }
        .data(),
        solana_prediction_market::accounts::PlaceBet {
            user: user.pubkey(),
            market,
            position,
            vault,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    send_ix(&mut svm, ix, &user);

    let account = svm.get_account(&market).unwrap();
    let mut data: &[u8] = &account.data;
    let market_state = Market::try_deserialize(&mut data).unwrap();
    assert_eq!(market_state.total_pool, BET_AMOUNT);
    assert_eq!(market_state.option_pools[0], BET_AMOUNT);

    let account = svm.get_account(&position).unwrap();
    let mut data: &[u8] = &account.data;
    let position_state = Position::try_deserialize(&mut data).unwrap();
    assert_eq!(position_state.market, market);
    assert_eq!(position_state.user, user.pubkey());
    assert_eq!(position_state.option_index, 0);
    assert_eq!(position_state.amount, BET_AMOUNT);
    assert!(!position_state.claimed);

    assert_eq!(svm.get_balance(&vault).unwrap(), BET_AMOUNT);

    // 4. resolve_market with winning_option = 0
    set_unix_timestamp(&mut svm, end_time + 500);

    let ix = Instruction::new_with_bytes(
        program_id,
        &solana_prediction_market::instruction::ResolveMarket { winning_option: 0 }.data(),
        solana_prediction_market::accounts::ResolveMarket {
            admin: admin.pubkey(),
            market_authority,
            market,
        }
        .to_account_metas(None),
    );
    send_ix(&mut svm, ix, &admin);

    let account = svm.get_account(&market).unwrap();
    let mut data: &[u8] = &account.data;
    let market_state = Market::try_deserialize(&mut data).unwrap();
    assert!(market_state.resolved);
    assert_eq!(market_state.winning_option, 0);

    // 5. claim_reward
    let admin_balance_before_claim = svm.get_balance(&admin.pubkey()).unwrap();

    let ix = Instruction::new_with_bytes(
        program_id,
        &solana_prediction_market::instruction::ClaimReward {
            position_index: POSITION_INDEX,
        }
        .data(),
        solana_prediction_market::accounts::ClaimReward {
            user: user.pubkey(),
            market_authority,
            market,
            position,
            vault,
            admin: admin.pubkey(),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    send_ix(&mut svm, ix, &user);

    let account = svm.get_account(&position).unwrap();
    let mut data: &[u8] = &account.data;
    let position_state = Position::try_deserialize(&mut data).unwrap();
    assert!(position_state.claimed);

    // sole bettor wins the whole pool back, minus the protocol fee; the vault is drained to
    // exactly 0 lamports, so the account no longer exists on-chain.
    let expected_fee = (BET_AMOUNT as u128 * FEE_RATE_BPS as u128 / 10_000) as u64;
    assert_eq!(svm.get_balance(&vault).unwrap_or(0), 0);
    assert_eq!(
        svm.get_balance(&admin.pubkey()).unwrap() - admin_balance_before_claim,
        expected_fee
    );
}
