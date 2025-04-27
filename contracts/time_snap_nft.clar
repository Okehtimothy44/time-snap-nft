;; Time Snap NFT Contract
;; A SIP-009 compliant time-limited NFT contract for digital collectibles
;; Enables minting, validity checking, and optional renewal of NFTs

;; Implement SIP-009 NFT trait
(impl-trait .nft-trait.nft-trait)

;; Error Constants
(define-constant ERR_UNAUTHORIZED u1001)
(define-constant ERR_INVALID_TOKEN u1002)
(define-constant ERR_TOKEN_EXPIRED u1003)
(define-constant ERR_TOKEN_NOT_FOUND u1004)
(define-constant ERR_RENEWAL_NOT_ALLOWED u1005)

;; Contract Owner
(define-constant CONTRACT_OWNER tx-sender)

;; Define NFT
(define-non-fungible-token time-snap-nft uint)

;; Token Variables
(define-data-var last-token-id uint u0)
(define-data-var token-uri (string-utf8 256) u"")

;; NFT Metadata Map
(define-map nft-metadata 
  uint 
  {
    owner: principal,
    created-at: uint,
    expires-at: uint,
    metadata: (string-utf8 256)
  }
)

;; Check if NFT is valid based on current block height
(define-private (is-nft-valid (token-id uint))
  (let ((metadata (unwrap! (map-get? nft-metadata token-id) false)))
    (<= block-height (get expires-at metadata))
  )
)

;; Mint a new time-limited NFT
(define-public (mint 
  (recipient principal) 
  (metadata (string-utf8 256)) 
  (duration uint)
)
  (let 
    (
      (new-token-id (+ (var-get last-token-id) u1))
      (current-block block-height)
      (expiration-block (+ current-block duration))
    )
    ;; Validate duration
    (asserts! (> duration u0) (err ERR_INVALID_TOKEN))
    
    ;; Authorize only contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err ERR_UNAUTHORIZED))
    
    ;; Update token metadata
    (map-set nft-metadata new-token-id {
      owner: recipient,
      created-at: current-block,
      expires-at: expiration-block,
      metadata: metadata
    })
    
    ;; Update last token ID
    (var-set last-token-id new-token-id)
    
    ;; Mint the NFT
    (try! (nft-mint? time-snap-nft new-token-id recipient))
    
    (ok new-token-id)
  )
)

;; Renew an expired NFT
(define-public (renew-nft (token-id uint) (additional-duration uint))
  (let 
    (
      (metadata (unwrap! (map-get? nft-metadata token-id) (err ERR_TOKEN_NOT_FOUND)))
      (current-block block-height)
    )
    ;; Validate ownership
    (asserts! (is-eq tx-sender (get owner metadata)) (err ERR_UNAUTHORIZED))
    
    ;; Validate additional duration
    (asserts! (> additional-duration u0) (err ERR_INVALID_TOKEN))
    
    ;; Require current NFT to be expired
    (asserts! (< (get expires-at metadata) current-block) (err ERR_RENEWAL_NOT_ALLOWED))
    
    ;; Update expiration
    (map-set nft-metadata token-id (merge metadata {
      expires-at: (+ current-block additional-duration)
    }))
    
    (ok true)
  )
)

;; Check NFT Validity
(define-read-only (get-nft-validity (token-id uint))
  (begin
    (asserts! (is-some (map-get? nft-metadata token-id)) (err ERR_TOKEN_NOT_FOUND))
    (ok (is-nft-valid token-id))
  )
)

;; SIP-009 Required Functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some (var-get token-uri)))
)

(define-read-only (get-owner (token-id uint))
  (let ((metadata (map-get? nft-metadata token-id)))
    (if (is-some metadata)
        (ok (get owner (unwrap-panic metadata)))
        (err ERR_TOKEN_NOT_FOUND)
    )
  )
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    ;; Validate sender authorization
    (asserts! (is-eq tx-sender sender) (err ERR_UNAUTHORIZED))
    
    ;; Check token validity
    (asserts! (is-nft-valid token-id) (err ERR_TOKEN_EXPIRED))
    
    ;; Transfer the NFT
    (try! (nft-transfer? time-snap-nft token-id sender recipient))
    
    ;; Update metadata owner
    (let ((metadata (unwrap-panic (map-get? nft-metadata token-id))))
      (map-set nft-metadata token-id (merge metadata { owner: recipient }))
    )
    
    (ok true)
  )
)