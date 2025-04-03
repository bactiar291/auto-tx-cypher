const { ethers } = require("ethers");
const fs = require("fs");
const GLITCH_ART = `
  █████╗ ███╗  ██╗ █████╗ ███╗  ██╗██████╗  ██████╗████████╗██╗ █████╗ ██████╗
 ██╔══██╗████╗ ██║██╔══██╗████╗ ██║██╔══██╗██╔════╝╚══██╔══╝██║██╔══██╗██╔══██╗
 ███████║██╔██╗██║███████║██╔██╗██║██████╔╝██║        ██║   ██║███████║██████╔╝
 ██╔══██║██║╚████║██╔══██║██║╚████║██╔══██╗██║        ██║   ██║██╔══██║██╔══██╗
 ██║  ██║██║ ╚███║██║  ██║██║ ╚███║██████╔╝╚██████╗   ██║   ██║██║  ██║██║  ██║
 ╚═╝  ╚═╝╚═╝  ╚══╝╚═╝  ╚═╝╚═╝  ╚══╝╚═════╝  ╚═════╝   ╚═╝   ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
`;

// Konfigurasi Jaringan
const RPC_URL = "https://testnet-rpc3.cypher.z1labs.ai";
const CONTRACT_ADDRESS = "0xb7229F1209d4c5bdc47996da3C64BecD84084025";
const RECIPIENT_ADDRESS = "0x91F5b89988f094566D7D0545A89fCb4D41269db4";
const PRIVATE_KEY = fs.readFileSync("wallet.txt", "utf-8").trim();
const AMOUNT = 0.00000000491;
const DECIMALS = 18;
const MAX_RETRIES = 3;

// Lengkapi ABI ERC-20
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, wallet);

function glitchEffect(text) {
    const chars = text.split('');
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?".split('');
    for (let i = 0; i < 3; i++) {
        const pos = Math.floor(Math.random() * chars.length);
        chars[pos] = symbols[Math.floor(Math.random() * symbols.length)];
    }
    return chars.join('');
}

async function getGasParameters() {
    try {
        const feeData = await provider.getFeeData();
        
        const baseFee = Number(ethers.formatUnits(feeData.gasPrice, 'gwei')) * 1.3;
        const maxPriorityFeePerGas = ethers.parseUnits(
            (baseFee * 0.25).toFixed(9), 
            'gwei'
        );

        const maxFeePerGas = ethers.parseUnits(
            (baseFee + Number(ethers.formatUnits(maxPriorityFeePerGas, 'gwei'))).toFixed(9),
            'gwei'
        );

        return {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit: 80000
        };
    } catch (e) {
        console.log(`▓▒░ GAS ERROR: ${glitchEffect(e.message)}`);
        return null;
    }
}

async function sendEncryptedTransfer(retryCount = 0) {
    try {
        const gasParams = await getGasParameters();
        if (!gasParams) return null;

        const rawAmount = ethers.parseUnits(AMOUNT.toString(), DECIMALS);
        const shortAddress = `${RECIPIENT_ADDRESS.slice(0,6)}...${RECIPIENT_ADDRESS.slice(-4)}`;
        const glitchedAddress = glitchEffect(shortAddress);

        const tx = await contract.transfer.populateTransaction(
            RECIPIENT_ADDRESS,
            rawAmount
        );

        const txResponse = await wallet.sendTransaction({
            ...tx,
            ...gasParams
        });

        console.log(GLITCH_ART);
        console.log(`\n[${new Date().toLocaleTimeString()}] ${glitchedAddress}`);
        console.log(`▓▒░ Hash: ${txResponse.hash}`);
        console.log(`▓▒░ Amount: ${AMOUNT} eDEAI`);
        console.log(`▓▒░ Gas Used: ${gasParams.gasLimit} (${ethers.formatUnits(gasParams.maxFeePerGas, 'gwei')} Gwei)`);
        console.log(`▓▒░ Explorer: https://testnet3.cypherscan.ai/tx/${txResponse.hash}`);
        console.log("▓▒░ anambactiar protocol activated ░▒▓\n");

        return txResponse;
        
    } catch (e) {
        if(retryCount < MAX_RETRIES) {
            console.log(`▓▒░ Retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return sendEncryptedTransfer(retryCount + 1);
        }
        console.log(`▓▒░ TX ERROR: ${glitchEffect(e.message)}`);
        return null;
    }
}

(async () => {
    console.log("▓▓▓ anambactiar glitch engine initialized ▓▓▓");
    
    try {
        // Cek saldo dengan parameter yang benar
        const [balance, tokenBalance] = await Promise.all([
            provider.getBalance(wallet.address),
            contract.balanceOf(wallet.address) // Tambahkan parameter alamat
        ]);
        
        console.log(`▓▒░ Wallet Balance: ${ethers.formatEther(balance)} CYPHER`);
        console.log(`▓▒░ Token Balance: ${ethers.formatUnits(tokenBalance, DECIMALS)} eDEAI`);
        
        if(Number(ethers.formatUnits(tokenBalance, DECIMALS)) < AMOUNT) {
            throw new Error("Insufficient token balance");
        }

    } catch (e) {
        console.log(`▓▒░ INIT ERROR: ${glitchEffect(e.message)}`);
        process.exit(1);
    }

    let counter = 1;
    while(true) {
        console.log(`\n▓▒░ Transmission #${counter}`);
        await sendEncryptedTransfer();
        await new Promise(resolve => 
            setTimeout(resolve, 600 + Math.random() * 1000)
        );
        counter++;
    }
})();
