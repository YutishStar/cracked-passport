// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CrackedCertificates} from "../src/CrackedCertificates.sol";

contract CrackedCertificatesTest is Test {
    CrackedCertificates certs;
    address owner = address(0xA11CE);
    address alice = address(0xA11);
    address bob = address(0xB0B);
    address carol = address(0xCA401);

    uint256 constant HACKATHON = 1;

    function setUp() public {
        vm.prank(owner);
        certs = new CrackedCertificates(owner);
        vm.prank(owner);
        certs.createActivity(HACKATHON, "Da Nang Hackathon", "ipfs://cid-hack");
    }

    function test_ManyPeopleClaimTheSameActivity() public {
        vm.startPrank(owner);
        certs.claimFor(HACKATHON, alice);
        certs.claimFor(HACKATHON, bob);
        vm.stopPrank();

        assertEq(certs.balanceOf(alice, HACKATHON), 1);
        assertEq(certs.balanceOf(bob, HACKATHON), 1);
        assertEq(certs.claimCount(HACKATHON), 2);
        assertEq(certs.uri(HACKATHON), "ipfs://cid-hack");
    }

    function test_CannotClaimTwice() public {
        vm.prank(owner);
        certs.claimFor(HACKATHON, alice);

        vm.expectRevert(CrackedCertificates.AlreadyClaimed.selector);
        vm.prank(owner);
        certs.claimFor(HACKATHON, alice);
    }

    function test_CannotClaimUnknownActivity() public {
        vm.expectRevert(CrackedCertificates.UnknownActivity.selector);
        vm.prank(owner);
        certs.claimFor(999, alice);
    }

    function test_OnlyOwnerCanMint() public {
        vm.expectRevert();
        vm.prank(alice);
        certs.claimFor(HACKATHON, alice);
    }

    function test_CertificatesAreSoulbound() public {
        vm.prank(owner);
        certs.claimFor(HACKATHON, alice);

        vm.expectRevert(CrackedCertificates.Soulbound.selector);
        vm.prank(alice);
        certs.safeTransferFrom(alice, bob, HACKATHON, 1, "");
    }

    function test_BatchClaim_SkipsDuplicates() public {
        vm.prank(owner);
        certs.claimFor(HACKATHON, alice);

        address[] memory holders = new address[](3);
        holders[0] = alice; // already claimed — should be skipped, not revert
        holders[1] = bob;
        holders[2] = carol;

        vm.prank(owner);
        certs.claimForMany(HACKATHON, holders);

        assertEq(certs.balanceOf(alice, HACKATHON), 1); // still just one
        assertEq(certs.balanceOf(bob, HACKATHON), 1);
        assertEq(certs.balanceOf(carol, HACKATHON), 1);
        assertEq(certs.claimCount(HACKATHON), 3);
    }

    function test_Revoke() public {
        vm.prank(owner);
        certs.claimFor(HACKATHON, alice);
        vm.prank(owner);
        certs.revoke(HACKATHON, alice);

        assertEq(certs.balanceOf(alice, HACKATHON), 0);
        assertEq(certs.claimCount(HACKATHON), 0);
        assertFalse(certs.hasClaimed(HACKATHON, alice));
    }

    function test_AdminTransfer_MovesToNewWallet() public {
        vm.prank(owner);
        certs.claimFor(HACKATHON, alice);
        vm.prank(owner);
        certs.adminTransfer(HACKATHON, alice, bob);

        assertEq(certs.balanceOf(alice, HACKATHON), 0);
        assertEq(certs.balanceOf(bob, HACKATHON), 1);
    }

    function test_SetActivityURI() public {
        vm.prank(owner);
        certs.setActivityURI(HACKATHON, "ipfs://cid-new");
        assertEq(certs.uri(HACKATHON), "ipfs://cid-new");
    }
}
