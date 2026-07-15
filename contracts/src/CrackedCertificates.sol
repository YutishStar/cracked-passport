// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrackedCertificates
 * @notice Proof-of-participation for everything that happens around Cracked:
 *         hackathons, Luma events, house activities, and the daily build posts
 *         fellows publish. Each *activity* is one token id; everyone who took
 *         part claims the same id. That's the ERC-1155 shape — one badge, many
 *         holders — as opposed to the Passport, which is one token per person.
 *
 *         Like the Passport, these are soulbound: a certificate says "you were
 *         there", so it can't be sold or handed off. The Cracked issuer wallet
 *         pays the gas and mints on the claimer's behalf, so fellows never need
 *         to hold funds or sign a transaction.
 */
contract CrackedCertificates is ERC1155, Ownable {
    /// @notice Human-readable name of each activity (id => title).
    mapping(uint256 => string) public activityName;
    /// @notice Per-activity metadata pointer (id => ipfs://...).
    mapping(uint256 => string) private _uri;
    /// @notice How many people have claimed each activity.
    mapping(uint256 => uint256) public claimCount;
    /// @notice Guards double-claims (id => holder => claimed).
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    /// @dev Set only during an owner-initiated adminTransfer.
    bool private _adminMoving;

    error Soulbound();
    error AlreadyClaimed();
    error UnknownActivity();

    event ActivityCreated(uint256 indexed id, string name, string uri);
    event Claimed(uint256 indexed id, address indexed holder);
    // NOTE: the ERC-1155 `URI(string,uint256)` event is inherited from IERC1155;
    // we emit it on metadata changes so explorers refresh.

    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {}

    /// @notice Register an activity before anyone can claim it.
    function createActivity(uint256 id, string calldata name, string calldata metadataUri)
        external
        onlyOwner
    {
        activityName[id] = name;
        _uri[id] = metadataUri;
        emit ActivityCreated(id, name, metadataUri);
        emit URI(metadataUri, id);
    }

    /// @notice Mint one certificate to a claimer. Owner-only: the server checks
    ///         the claimer is a verified fellow with a valid claim code first,
    ///         then calls this — so the fellow pays nothing.
    function claimFor(uint256 id, address holder) external onlyOwner {
        if (bytes(activityName[id]).length == 0) revert UnknownActivity();
        if (hasClaimed[id][holder]) revert AlreadyClaimed();
        hasClaimed[id][holder] = true;
        unchecked {
            claimCount[id] += 1;
        }
        _mint(holder, id, 1, "");
        emit Claimed(id, holder);
    }

    /// @notice Mint one activity to many claimers at once (cheaper for events).
    function claimForMany(uint256 id, address[] calldata holders) external onlyOwner {
        if (bytes(activityName[id]).length == 0) revert UnknownActivity();
        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];
            if (hasClaimed[id][holder]) continue; // skip dupes rather than revert the batch
            hasClaimed[id][holder] = true;
            unchecked {
                claimCount[id] += 1;
            }
            _mint(holder, id, 1, "");
            emit Claimed(id, holder);
        }
    }

    /// @notice Update an activity's metadata (e.g. after the artwork is final).
    function setActivityURI(uint256 id, string calldata metadataUri) external onlyOwner {
        if (bytes(activityName[id]).length == 0) revert UnknownActivity();
        _uri[id] = metadataUri;
        emit URI(metadataUri, id);
    }

    /// @notice Revoke a wrongly-issued certificate.
    function revoke(uint256 id, address holder) external onlyOwner {
        _burn(holder, id, 1);
        hasClaimed[id][holder] = false;
        unchecked {
            claimCount[id] -= 1;
        }
    }

    /// @notice Escape hatch: move a holder's certificates to a new wallet if
    ///         they lose access to the old one.
    function adminTransfer(uint256 id, address from, address to) external onlyOwner {
        _adminMoving = true;
        _safeTransferFrom(from, to, id, 1, "");
        hasClaimed[id][from] = false;
        hasClaimed[id][to] = true;
        _adminMoving = false;
    }

    function uri(uint256 id) public view override returns (string memory) {
        return _uri[id];
    }

    /// @dev Soulbound: allow mint (from 0), burn (to 0) and adminTransfer only.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
    {
        if (from != address(0) && to != address(0) && !_adminMoving) {
            revert Soulbound();
        }
        super._update(from, to, ids, values);
    }
}
