import { useEffect,createContext, useState } from 'react';
export const Web3Context = createContext<number | null>(null);

import Web3, { HexString } from 'web3'; // Ensure Web3.js is correctly imported

import Send from './Send';
import Receive from './Receive';

import { getEstimateAddress, fetchBalance, fetchERC20Balance } from './estimateAddress';
import {
    chainIdandType,
    chainInfo
} from './chainInfo';

import notification from '../assets/notification.png';
import discover from '../assets/discover.png';
import downArrow from '../assets/downarrow.png';
import upArrow from '../assets/uparrow.png';
import TransactionHistory from './TransactionHistory';
import {getAllTransactions} from './database/indexDb'
import Loading from './popups/Loading';
export default function Transfer(props: any) {
    const { currentCoin, handleBackClick, userInfo } = props;
    const { name, rawId, publicKeys } = userInfo || {}; // Safely destructure userInfo

    const [web3, setWeb3] = useState<Web3 | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<number>(0);
    const [isSend, setIsSend] = useState<boolean>(false);
    const [isReceive, setIsReceive] = useState<boolean>(false);
    const [transactions, setTransactions] = useState([] as any);

    //Loading..
    const [loading, setLoading] = useState<boolean>(true); 
    
    console.log('chainType:', currentCoin?.chain);

    function getBundelerURL(hexChainID: keyof typeof chainIdandType) {
        if (!(hexChainID in chainIdandType)) {
            throw new Error(`Unsupported chain ID: ${hexChainID}`);
        }
        const chainType = chainIdandType[hexChainID] as keyof typeof chainInfo;
        return chainInfo[chainType].USER_OP_RPC_URL;
    }

    //Getting web3 bundler url
    useEffect(() => {
        if (!currentCoin?.chain) return;
        const web3URL = getBundelerURL(currentCoin.chain);
        setWeb3(new Web3(web3URL));
    }, [currentCoin]);
    
    useEffect(() => {
        if(!rawId) return;
        console.log({rawId});
        const fetchTransactions = async () => {
          const allTransactions = await getAllTransactions(rawId);
          console.log({allTransactions}); 
          setTransactions(allTransactions);
        };
        fetchTransactions();
      }, [isSend,rawId]);

    //Calculating estimate address
    useEffect(() => {
        if (!rawId || !publicKeys || !web3) return;
        console.log('Fetching estimated address...', name, rawId);

        const fetchContractAddress = async () => {
            try {
                const estimateAddress = await getEstimateAddress(web3, publicKeys);
                setAddress(estimateAddress);
            } catch (error) {
                console.error('Error fetching contract address:', error);
            }
        };

        fetchContractAddress();
    }, [rawId, publicKeys, web3]);

    //Fetching the balance
    useEffect(() => {
        if (!address || !web3) return;
        const balance = async (address:HexString) => {
            var fetchedBalance = 0;
            if (currentCoin?.type === "COIN")
                fetchedBalance = await fetchBalance(web3, address);
            else
                fetchedBalance = await fetchERC20Balance(web3, address,currentCoin?.chain, currentCoin?.name);

            setBalance(fetchedBalance);
        };

        balance(address);  // Fetch conBalance immediately on address change
        setLoading(false);
        // Start the interval to fetch conBalance every 5 seconds
        const intervalId = setInterval(() => {
            balance(address);
        }, 5000);  // Set interval for conBalance updates

        // Cleanup interval on address change or component unmount
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [address, web3]);

    return (
        <>
            {!(isSend || isReceive) && (
                <div>
                    <div style={tokenHeader}>
                        <span style={arrow} onClick={handleBackClick}>‹</span> {/* Back Arrow */}
                        <div style={tokenContent}>
                            <h3>{currentCoin?.symbol}</h3>
                            <p>{currentCoin?.type} | {currentCoin?.name}</p>
                        </div>
                        <img src={notification} style={Icon} alt="Notification Icon" />
                        <img src={discover} style={Icon} alt="Discover Icon" />
                    </div>
                    <div style={coinInfo}>
                        <h2>{currentCoin?.symbol}</h2>
                        <p>{balance} {currentCoin?.symbol}</p>
                    </div>
                    <div style={transferButtons}>
                        <div>
                            <img src={downArrow} style={transferIcon} alt="downArrow Icon" onClick={() => setIsSend(true)} />
                            <p>Send</p>
                        </div>
                        <div>
                            <img src={upArrow} style={transferIcon} alt="upArrow Icon" onClick={() => setIsReceive(true)} />
                            <p>Receive</p>
                        </div>
                    </div>
                    {loading? <Loading /> : (
                        <div style={history}>
                            <p>History</p>
                            <TransactionHistory currentCoinType={currentCoin.symbol} walletAddress={address} chainhex={currentCoin.chain}></TransactionHistory>
                        </div>)
                    }
                </div>
            )}
            <Web3Context.Provider value={balance}>
                {isSend && <Send web3={web3} rawId={rawId} publicKeys={publicKeys} address={address} currentCoin={currentCoin} isSend={setIsSend} />}
            </Web3Context.Provider>
            {isReceive && <Receive address={address} isReceive={setIsReceive} />}
        </>
    );
}

// Styles
const tokenHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px dotted lavender',
    backgroundColor: '#fff',
    height: '75px',
    marginBottom: '10px'
};
const tokenContent: React.CSSProperties = {
    lineHeight: '10px',
    textAlign: 'left',
};
const coinInfo: React.CSSProperties = {
    border: '1px solid black',
    borderRadius: '15px',
    height: '120px',
    marginBottom: '10px'
};
const transferButtons: React.CSSProperties = {
    marginTop: '30px',
    display: 'flex',
    textAlign: 'center',
    justifyContent: 'space-around',
    lineHeight: '10px',
    borderBottom: '1px solid #cfcad2'
};
const transferIcon: React.CSSProperties = {
    backgroundColor: '#cfcad2',
    padding: '15px',
    borderRadius: '50px'
};
const history: React.CSSProperties = {};
const arrow: React.CSSProperties = {
    color: '#000',
    fontSize: '40px',
    cursor: 'pointer',
    marginRight: '10px',
    paddingRight: '10px'
};
const Icon: React.CSSProperties = {
    width: '30px'
};
