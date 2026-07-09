// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrackedPassport
 * @notice Soulbound membership passport. One token per Cracked Fellow, where
 *         tokenId == the fellow's number (#001 => tokenId 1). The contract owner
 *         (the Cracked issuer wallet) mints and updates; holders never transfer.
 *
 *         The chain holds only proof of membership + a metadata pointer. Stamps,
 *         achievements and perks live off-chain and are reflected by refreshing
 *         the token URI.
 */
contract CrackedPassport is ERC721URIStorage, Ownable {
    /// @dev Set only for the duration of an owner-initiated adminTransfer, so the
    ///      soulbound guard in _update() can allow that single move.
    bool private _adminMoving;

    error Soulbound();

    constructor(address initialOwner)
        ERC721("Cracked Passport", "CRACKED")
        Ownable(initialOwner)
    {}

    /// @notice Mint a passport to `to` with `fellowNumber` as the tokenId.
    function mintPassport(address to, uint256 fellowNumber, string calldata uri)
        external
        onlyOwner
    {
        _safeMint(to, fellowNumber);
        _setTokenURI(fellowNumber, uri);
    }

    /// @notice Update a passport's metadata pointer (after a new stamp, etc.).
    ///         _setTokenURI emits ERC-4906 MetadataUpdate so explorers refresh.
    function setTokenURI(uint256 tokenId, string calldata uri) external onlyOwner {
        _requireOwned(tokenId);
        _setTokenURI(tokenId, uri);
    }

    /// @notice Burn a passport (revoke membership).
    function revoke(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    /// @notice Escape hatch: move a passport to a new wallet if a Fellow loses
    ///         access to the old one. Owner-only; the only allowed transfer.
    function adminTransfer(uint256 tokenId, address newWallet) external onlyOwner {
        _adminMoving = true;
        _transfer(ownerOf(tokenId), newWallet, tokenId);
        _adminMoving = false;
    }

    /// @dev Soulbound guard: allow mint (from 0), burn (to 0) and adminTransfer;
    ///      revert all holder-initiated transfers.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && !_adminMoving) {
            revert Soulbound();
        }
        return super._update(to, tokenId, auth);
    }
}
