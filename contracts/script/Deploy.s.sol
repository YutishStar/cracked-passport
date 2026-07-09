// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CrackedPassport} from "../src/CrackedPassport.sol";

/**
 * Deploys CrackedPassport with the broadcasting key as the initial owner.
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url fuji --broadcast --verify
 */
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address owner = vm.addr(pk);
        vm.startBroadcast(pk);
        CrackedPassport passport = new CrackedPassport(owner);
        vm.stopBroadcast();
        console2.log("CrackedPassport deployed at:", address(passport));
        console2.log("Owner:", owner);
    }
}
