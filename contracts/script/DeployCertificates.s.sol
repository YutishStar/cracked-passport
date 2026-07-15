// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {CrackedCertificates} from "../src/CrackedCertificates.sol";

/**
 * Deploys CrackedCertificates with the broadcasting key as the owner (the same
 * issuer wallet that owns CrackedPassport, so one wallet pays all the gas).
 *   forge script script/DeployCertificates.s.sol --rpc-url fuji --broadcast
 */
contract DeployCertificates is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address owner = vm.addr(pk);
        vm.startBroadcast(pk);
        CrackedCertificates certs = new CrackedCertificates(owner);
        vm.stopBroadcast();
        console2.log("CrackedCertificates deployed at:", address(certs));
        console2.log("Owner:", owner);
    }
}
