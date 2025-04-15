// dex.js

const routerAbi = [/* Add your UniswapV2Router ABI here */];
const tokenAbi = [/* Standard ERC20 ABI here */];
const routerAddress = '0xYourRouterAddress'; // Replace with your deployed router address
const coreNetwork = {
  chainId: '0x45C', // 1116 in hex
  chainName: 'CoreDAO',
  nativeCurrency: {
    name: 'CORE',
    symbol: 'CORE',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.coredao.org'],
  blockExplorerUrls: ['https://scan.coredao.org'],
};

let web3;
let userAccount;

async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask!');
    return;
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.getAccounts();
  userAccount = accounts[0];
  document.getElementById('walletStatus').textContent = 'Wallet Connected: ' + userAccount;
}

async function switchToCoreDAO() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [coreNetwork],
    });
  } catch (error) {
    console.error('Failed to switch network', error);
  }
}

async function swapTokens() {
  const fromToken = document.getElementById('fromToken').value;
  const toToken = document.getElementById('toToken').value;
  const amount = document.getElementById('amount').value;
  const slippage = parseFloat(document.getElementById('slippage').value || 0.5);

  if (!web3) return alert('Connect wallet first!');
  const router = new web3.eth.Contract(routerAbi, routerAddress);
  const token = new web3.eth.Contract(tokenAbi, fromToken);
  const amountInWei = web3.utils.toWei(amount, 'ether');

  await token.methods.approve(routerAddress, amountInWei).send({ from: userAccount });

  const path = [fromToken, toToken];
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Estimate output
  const amountsOut = await router.methods.getAmountsOut(amountInWei, path).call();
  const minOut = web3.utils.toBN(amountsOut[1])
    .mul(web3.utils.toBN(1000 - Math.floor(slippage * 10)))
    .div(web3.utils.toBN(1000));

  await router.methods.swapExactTokensForTokens(
    amountInWei,
    minOut.toString(),
    path,
    userAccount,
    deadline
  ).send({ from: userAccount });

  alert('Swap executed!');
}

async function addLiquidity() {
  const tokenA = document.getElementById('liqTokenA').value;
  const tokenB = document.getElementById('liqTokenB').value;
  const amountA = document.getElementById('liqAmountA').value;
  const amountB = document.getElementById('liqAmountB').value;

  if (!web3) return alert('Connect wallet first!');
  const router = new web3.eth.Contract(routerAbi, routerAddress);
  const tokenAContract = new web3.eth.Contract(tokenAbi, tokenA);
  const tokenBContract = new web3.eth.Contract(tokenAbi, tokenB);

  const amountAWei = web3.utils.toWei(amountA, 'ether');
  const amountBWei = web3.utils.toWei(amountB, 'ether');

  await tokenAContract.methods.approve(routerAddress, amountAWei).send({ from: userAccount });
  await tokenBContract.methods.approve(routerAddress, amountBWei).send({ from: userAccount });

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  await router.methods.addLiquidity(
    tokenA,
    tokenB,
    amountAWei,
    amountBWei,
    0,
    0,
    userAccount,
    deadline
  ).send({ from: userAccount });

  alert('Liquidity added!');
}
