// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {MockENSResolver} from "../src/MockENSResolver.sol";

contract DeployENS is Script {
    function run() external {
        // Load deployer private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockENSResolver
        MockENSResolver mockENS = new MockENSResolver();
        console.log("MockENSResolver deployed at:", address(mockENS));

        vm.stopBroadcast();

        // Update config.json
        string memory path = "../frontend/src/config.json";
        string memory json = vm.readFile(path);
        
        // Simple string manipulation to append the new key
        // Find the last closing brace and insert the new key before it
        // We assume the JSON ends with "}" or "}\n"
        
        // Note: This is a hacky way to manipulate JSON in Solidity, 
        // but it works for this specific file structure without needing full JSON parsing.
        // essentially: s.replace('}', ', "mockENSAddress": "0x..." }')
        
        // Check if we need a comma (if the file doesn't have one before the last brace)
        // But simpler: just slice off the last '}' and append our part.
        
        bytes memory jsonBytes = bytes(json);
        uint256 len = jsonBytes.length;
        
        // Find the last '}'
        uint256 lastBrace;
        for(uint256 i = len; i > 0; i--) {
            if (jsonBytes[i-1] == 0x7D) { // '}' is 0x7D
                lastBrace = i-1;
                break;
            }
        }
        
        // Construct new JSON
        // We take everything up to the last brace, add a comma, our new key, and close the brace.
        // NOTE: If the last item didn't have a trailing comma, we need to add one.
        // Standard JSON doesn't have trailing commas, so we normally simply add one.
        
        // We slice manually
        bytes memory prefix = new bytes(lastBrace);
        for(uint256 i = 0; i < lastBrace; i++) {
            prefix[i] = jsonBytes[i];
        }
        
        string memory suffix = string.concat(
            ',\n  "mockENSAddress": "', 
            vm.toString(address(mockENS)), 
            '"\n}'
        );
        
        string memory finalJson = string.concat(string(prefix), suffix);
        
        vm.writeFile(path, finalJson);
        console.log("Updated config.json with mockENSAddress");
    }
}
