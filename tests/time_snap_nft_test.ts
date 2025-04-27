import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

/**
 * TimeSnap NFT Test Suite
 * Covers comprehensive testing scenarios for the time-limited NFT contract
 */

// Minting Tests
Clarinet.test({
  name: "Minting: Successfully mint an NFT with valid duration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const recipient = accounts.get('wallet_1')!;
    const metadata = "Test NFT Metadata";
    const duration = 100;

    const block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(recipient.address), 
          types.utf8(metadata), 
          types.uint(duration)
        ], 
        deployer.address
      )
    ]);

    // Check successful minting
    block.receipts[0].result.expectOk().expectUint(1);

    // Verify metadata 
    const ownerResult = chain.callReadOnlyFn(
      'time-snap-nft', 
      'get-owner', 
      [types.uint(1)], 
      deployer.address
    );
    ownerResult.result.expectOk().expectPrincipal(recipient.address);
  }
});

Clarinet.test({
  name: "Minting: Fail to mint with zero duration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const recipient = accounts.get('wallet_1')!;
    const metadata = "Test NFT Metadata";
    const duration = 0;

    const block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(recipient.address), 
          types.utf8(metadata), 
          types.uint(duration)
        ], 
        deployer.address
      )
    ]);

    // Check minting failure due to invalid duration
    block.receipts[0].result.expectErr().expectUint(1002);
  }
});

Clarinet.test({
  name: "Minting: Unauthorized minting attempt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const unauthorized = accounts.get('wallet_1')!;
    const recipient = accounts.get('wallet_2')!;
    const metadata = "Test NFT Metadata";
    const duration = 100;

    const block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(recipient.address), 
          types.utf8(metadata), 
          types.uint(duration)
        ], 
        unauthorized.address
      )
    ]);

    // Check unauthorized minting failure
    block.receipts[0].result.expectErr().expectUint(1001);
  }
});

// Time Validity Tests
Clarinet.test({
  name: "Validity: Check NFT validity before and after expiration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const recipient = accounts.get('wallet_1')!;
    const metadata = "Time-limited NFT";
    const duration = 10;

    // Mint NFT
    let block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(recipient.address), 
          types.utf8(metadata), 
          types.uint(duration)
        ], 
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Check validity before expiration
    let validityCheck = chain.callReadOnlyFn(
      'time-snap-nft', 
      'get-nft-validity', 
      [types.uint(1)], 
      deployer.address
    );
    validityCheck.result.expectOk().expectBool(true);

    // Mine additional blocks to expire
    chain.mineEmptyBlock(duration + 1);

    // Check validity after expiration
    validityCheck = chain.callReadOnlyFn(
      'time-snap-nft', 
      'get-nft-validity', 
      [types.uint(1)], 
      deployer.address
    );
    validityCheck.result.expectOk().expectBool(false);
  }
});

// Renewal Tests
Clarinet.test({
  name: "Renewal: Successfully renew an expired token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const recipient = accounts.get('wallet_1')!;
    const metadata = "Renewable NFT";
    const initialDuration = 10;
    const renewalDuration = 20;

    // Mint NFT
    let block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(recipient.address), 
          types.utf8(metadata), 
          types.uint(initialDuration)
        ], 
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Expire the token
    chain.mineEmptyBlock(initialDuration + 1);

    // Renew the token
    block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'renew-nft', 
        [
          types.uint(1),
          types.uint(renewalDuration)
        ], 
        recipient.address
      )
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "Renewal: Fail to renew a non-expired token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const recipient = accounts.get('wallet_1')!;
    const metadata = "Non-renewable NFT";
    const duration = 100;

    // Mint NFT
    let block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(recipient.address), 
          types.utf8(metadata), 
          types.uint(duration)
        ], 
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Attempt to renew while still valid
    block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'renew-nft', 
        [
          types.uint(1),
          types.uint(50)
        ], 
        recipient.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(1005);
  }
});

// Transfer Tests
Clarinet.test({
  name: "Transfer: Successfully transfer a valid NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const sender = accounts.get('wallet_1')!;
    const recipient = accounts.get('wallet_2')!;
    const metadata = "Transferable NFT";
    const duration = 100;

    // Mint NFT
    let block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(sender.address), 
          types.utf8(metadata), 
          types.uint(duration)
        ], 
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Transfer NFT
    block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'transfer', 
        [
          types.uint(1),
          types.principal(sender.address),
          types.principal(recipient.address)
        ], 
        sender.address
      )
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Verify new owner
    const ownerResult = chain.callReadOnlyFn(
      'time-snap-nft', 
      'get-owner', 
      [types.uint(1)], 
      deployer.address
    );
    ownerResult.result.expectOk().expectPrincipal(recipient.address);
  }
});

Clarinet.test({
  name: "Transfer: Prevent transfer of expired NFT",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const sender = accounts.get('wallet_1')!;
    const recipient = accounts.get('wallet_2')!;
    const metadata = "Expired NFT";
    const duration = 10;

    // Mint NFT
    let block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(sender.address), 
          types.utf8(metadata), 
          types.uint(duration)
        ], 
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Expire the token
    chain.mineEmptyBlock(duration + 1);

    // Attempt to transfer expired NFT
    block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'transfer', 
        [
          types.uint(1),
          types.principal(sender.address),
          types.principal(recipient.address)
        ], 
        sender.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(1003);
  }
});

// Error Handling and Security Tests
Clarinet.test({
  name: "Security: Unauthorized owner modification attempt",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const unauthorized = accounts.get('wallet_1')!;
    const recipient = accounts.get('wallet_2')!;
    const metadata = "Secure NFT";
    const duration = 100;

    // Mint NFT
    let block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'mint', 
        [
          types.principal(recipient.address), 
          types.utf8(metadata), 
          types.uint(duration)
        ], 
        deployer.address
      )
    ]);
    block.receipts[0].result.expectOk().expectUint(1);

    // Attempt unauthorized transfer by non-owner
    block = chain.mineBlock([
      Tx.contractCall(
        'time-snap-nft', 
        'transfer', 
        [
          types.uint(1),
          types.principal(recipient.address),
          types.principal(unauthorized.address)
        ], 
        unauthorized.address
      )
    ]);
    block.receipts[0].result.expectErr().expectUint(1001);
  }
});