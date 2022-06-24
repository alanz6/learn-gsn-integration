const { RelayProvider } = require('@opengsn/provider')
const { GsnTestEnvironment } = require('@opengsn/dev' )
const ethers = require('ethers')
const { it, describe, before } = require('mocha')
const { assert } = require('chai')

const Web3HttpProvider = require( 'web3-providers-http')

//we still use truffle compiled files
const Token = require('../artifacts/contracts/Token.sol/Token')
const TokenStorage = require('../artifacts/contracts/Token.sol/TokenStorage')

describe('using ethers with OpenGSN', () => {
    let hardhatToken;
    let tokenStorage;
    let accounts
    let web3provider
    let from
    let owner
    before(async () => {
        let env = await GsnTestEnvironment.startGsn('localhost')

        const { paymasterAddress, forwarderAddress } = env.contractsDeployment
    
        const web3provider = new Web3HttpProvider('http://localhost:8545')
 
        const deploymentProvider = new ethers.providers.Web3Provider(web3provider)
        owner = deploymentProvider.getSigner();

        const tokenFactory = new ethers.ContractFactory(Token.abi, Token.bytecode, owner)
        hardhatToken = await tokenFactory.deploy();
        await hardhatToken.deployed();

        const storageFactory = new ethers.ContractFactory(TokenStorage.abi, TokenStorage.bytecode, owner)
        tokenStorage = await storageFactory.deploy(forwarderAddress, hardhatToken.address);
        await tokenStorage.deployed()

        const config = await {
            // loggerConfiguration: { logLevel: 'error'},
            paymasterAddress: paymasterAddress,
            auditorsCount: 0
        }
        // const hdweb3provider = new HDWallet('0x123456', 'http://localhost:8545')
        let gsnProvider = RelayProvider.newProvider({provider: web3provider, config})
    	await gsnProvider.init()
	   // The above is the full provider configuration. can use the provider returned by startGsn:
        // const gsnProvider = env.relayProvider

    	const account = new ethers.Wallet(Buffer.from('1'.repeat(64),'hex'))
        gsnProvider.addAccount(account.privateKey)
    	from = account.address

        // gsnProvider is now an rpc provider with GSN support. make it an ethers provider:
        const etherProvider = new ethers.providers.Web3Provider(gsnProvider)
        tokenStorage = tokenStorage.connect(etherProvider.getSigner(from))
    })

    describe('make a call', async () => {
        it('should not pay for gas (balance=0)', async () => {
            assert.equal(0, await tokenStorage.provider.getBalance(from))
            await tokenStorage.store(0);
            assert.equal(0, await tokenStorage.provider.getBalance(from))
        })
    })
})

