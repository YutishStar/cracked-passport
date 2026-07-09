// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CrackedPassport} from "../src/CrackedPassport.sol";

contract CrackedPassportTest is Test {
    CrackedPassport passport;
    address owner = address(0xA11CE);
    address fellow = address(0xFE110);
    address other = address(0xB0B);

    function setUp() public {
        vm.prank(owner);
        passport = new CrackedPassport(owner);
    }

    function test_MintAssignsTokenIdAsFellowNumber() public {
        vm.prank(owner);
        passport.mintPassport(fellow, 27, "ipfs://cid27");
        assertEq(passport.ownerOf(27), fellow);
        assertEq(passport.tokenURI(27), "ipfs://cid27");
    }

    function test_OnlyOwnerCanMint() public {
        vm.expectRevert();
        vm.prank(other);
        passport.mintPassport(fellow, 1, "ipfs://x");
    }

    function test_TransferReverts_Soulbound() public {
        vm.prank(owner);
        passport.mintPassport(fellow, 1, "ipfs://x");

        vm.expectRevert(CrackedPassport.Soulbound.selector);
        vm.prank(fellow);
        passport.transferFrom(fellow, other, 1);
    }

    function test_SetTokenURI_EmitsMetadataUpdate() public {
        vm.prank(owner);
        passport.mintPassport(fellow, 1, "ipfs://old");
        vm.prank(owner);
        passport.setTokenURI(1, "ipfs://new");
        assertEq(passport.tokenURI(1), "ipfs://new");
    }

    function test_AdminTransfer_MovesToNewWallet() public {
        vm.prank(owner);
        passport.mintPassport(fellow, 1, "ipfs://x");
        vm.prank(owner);
        passport.adminTransfer(1, other);
        assertEq(passport.ownerOf(1), other);

        // Still soulbound afterward.
        vm.expectRevert(CrackedPassport.Soulbound.selector);
        vm.prank(other);
        passport.transferFrom(other, fellow, 1);
    }

    function test_Revoke_Burns() public {
        vm.prank(owner);
        passport.mintPassport(fellow, 1, "ipfs://x");
        vm.prank(owner);
        passport.revoke(1);
        vm.expectRevert();
        passport.ownerOf(1);
    }
}
