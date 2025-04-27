# Time Snap NFT

A time-limited NFT platform enabling digital collectibles with expiration mechanisms on the Stacks blockchain.

## Project Overview

The Time Snap NFT project provides a Clarity smart contract that enables the creation of non-fungible tokens (NFTs) with time-based expiration mechanisms. This allows for the development of digital collectibles that have a limited lifespan, creating a sense of scarcity and urgency for users.

Key features of the Time Snap NFT contract include:

- Minting time-limited NFTs with a specified duration
- Renewing expired NFTs by extending their duration
- Transferring valid NFTs between principals
- Checking the validity of an NFT based on its expiration timestamp
- Robust security measures, including authorization checks and error handling

## Contract Architecture

The `time_snap_nft.clar` contract defines a SIP-009 compliant non-fungible token with the following key components:

**NFT Definition**:
- The contract defines a non-fungible token called `time-snap-nft` using the built-in `define-non-fungible-token` function.

**Token Metadata**:
- A `nft-metadata` map stores the metadata for each NFT, including the owner, creation timestamp, expiration timestamp, and a custom metadata string.

**Minting**:
- The `mint` function allows the contract owner to create new time-limited NFTs with a specified duration.
- The function performs various checks, such as verifying the duration and authorizing the contract owner.

**Renewal**:
- The `renew-nft` function allows the owner of an expired NFT to extend its duration by providing an additional duration.
- The function checks that the NFT is currently expired before allowing the renewal.

**Transfer**:
- The `transfer` function enables the transfer of valid NFTs between principals.
- The function verifies that the sender is authorized and that the NFT is currently valid before allowing the transfer.

**Validity Checks**:
- The `is-nft-valid` private function checks whether an NFT is currently valid based on its expiration timestamp.
- The `get-nft-validity` read-only function exposes this validity check to external callers.

**Error Handling**:
- The contract defines several error constants to represent different error conditions, such as unauthorized access, invalid tokens, and expired tokens.
- These error codes are used throughout the contract's functions to provide clear error messages.

## Installation & Setup

To use the Time Snap NFT contract, you'll need to have the following prerequisites:

- Clarinet (a Clarity smart contract development tool)
- Stacks blockchain development environment

Once you have the prerequisites, follow these steps to set up the project:

1. Clone the project repository: `git clone https://github.com/your-username/time-snap-nft.git`
2. Navigate to the project directory: `cd time-snap-nft`
3. Install dependencies: `clarinet install`
4. Configure the deployment environment by modifying the settings in the `settings/` directory.

## Usage Guide

Here are some examples of how to interact with the Time Snap NFT contract:

**Minting a new NFT**:
```clarity
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.time-snap-nft mint (principal 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1RE6CRZ7) (string-utf8 "My Time-Limited NFT") (u100))
```

**Renewing an expired NFT**:
```clarity
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.time-snap-nft renew-nft (u1) (u50))
```

**Transferring an NFT**:
```clarity
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.time-snap-nft transfer (u1) (principal 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1RE6CRZ7) (principal 'ST3PB33QB0G9Y4V3NPWGBHYQRKP0XNFCVEXZY0CSN))
```

## Testing

The Time Snap NFT contract has a comprehensive test suite implemented in the `time_snap_nft_test.ts` file. The tests cover the following scenarios:

1. Minting tests:
   - Successfully mint an NFT with valid duration
   - Fail to mint an NFT with zero duration
   - Fail to mint an NFT by an unauthorized principal

2. Time validity tests:
   - Check NFT validity before and after expiration

3. Renewal tests:
   - Successfully renew an expired token
   - Fail to renew a non-expired token

4. Transfer tests:
   - Successfully transfer a valid NFT
   - Prevent transfer of an expired NFT

5. Error handling and security tests:
   - Prevent unauthorized owner modification attempt

To run the tests, use the following command:

```
clarinet test
```

## Security Considerations

The Time Snap NFT contract includes several security measures to ensure the safety and integrity of the NFTs:

**Authorization Checks**:
- The `mint` function only allows the contract owner to create new NFTs.
- The `renew-nft` and `transfer` functions verify that the caller is the current owner of the NFT.

**Expiration Checks**:
- The `is-nft-valid` function checks whether an NFT has expired before allowing any operations on it.
- The `transfer` function prevents the transfer of expired NFTs.

**Error Handling**:
- The contract defines specific error codes to represent different error conditions, providing clear feedback to users.
- The contract uses `asserts!` to validate inputs and state before performing any state-changing operations.

**Permissions**:
- The contract uses the `define-constant` function to restrict access to the contract owner.

By implementing these security measures, the Time Snap NFT contract aims to provide a robust and secure platform for time-limited digital collectibles on the Stacks blockchain.