import { useState, useEffect } from 'react';
import { chainIdandType,chainInfo,API_KEY } from './chainInfo';
function TransactionHistory(props: { currentCoinType: string; walletAddress: any; chainhex:string }) {
  const [receivedTransactions, setReceivedTransactions] = useState<any[]>([]);
  const [sentTransactions, setSentTransactions] = useState<any[]>([]);
  const [chainName, setChainName] = useState<string>('');
  const chainId = props.chainhex as keyof typeof chainIdandType;
  const chain = chainIdandType[chainId] as keyof typeof chainInfo;
  
  useEffect(() => {
    if (chain) {
      setChainName(chain);
    }
  }, [chain]);

  const getAlchemyUrlAndCategory = (): { url: string; category: string[] } | undefined => {
    if (chainName === 'Amoy') {
      return {
        url: `https://polygon-amoy.g.alchemy.com/v2/${API_KEY}`,
        category: ["external","erc20"]
      };
    } else if (chainName === 'Sepolia'){
      return {
        url: `https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`,
        category: ["external", "erc20"]
      };
    }
    return undefined;
  };

  useEffect(() => {
    if (props.walletAddress) {
      // Fetch transactions immediately
      fetchReceivedTransactions();
      fetchSentTransactions();
  
      // Set interval to fetch transactions every 5 seconds
      const interval = setInterval(() => {
        fetchReceivedTransactions();
        fetchSentTransactions();
      }, 30000);
  
      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }
  }, [props.walletAddress, props.currentCoinType, chainName]);

  const fetchReceivedTransactions = async () => {
    try {
      const alchemyData = getAlchemyUrlAndCategory();
      if (!alchemyData) return;
      const { url, category } = alchemyData;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [
            {
              fromBlock: "0x0",
              toBlock: "latest",
              category: category,
              withMetadata: true,
              excludeZeroValue: true,
              maxCount: "0x64",
              toAddress: props.walletAddress,
            },
          ],
        }),
      });
      const data = await response.json();
      setReceivedTransactions(data.result.transfers || []);
    } catch (error) {
      console.error("Error fetching received transactions:", error);
    }
  };

  const fetchSentTransactions = async () => {
    try {
      const alchemyData = getAlchemyUrlAndCategory();
      if (!alchemyData) return;
      const { url, category } = alchemyData;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "alchemy_getAssetTransfers",
          params: [
            {
              fromBlock: "0x0",
              toBlock: "latest",
              category: category,
              withMetadata: true,
              excludeZeroValue: true,
              maxCount: "0x64",
              fromAddress: props.walletAddress,
            },
          ],
        }),
      });
      const data = await response.json();
      setSentTransactions(data.result.transfers || []);
    } catch (error) {
      console.error("Error fetching sent transactions:", error);
    }
  };

  const getExplorerUrl = () => {
    if (chainName === 'Amoy') {
      return "https://amoy.polygonscan.com/tx/";
    } else if(chainName === 'Sepolia'){
      return "https://sepolia.etherscan.io/tx/";
    }
  };

  return (
    <>
      <h3>Transaction History</h3>
      {receivedTransactions.length > 0 || sentTransactions.length > 0 ? (
        <ul>
          {[...receivedTransactions, ...sentTransactions]
            .filter(transaction => 
              transaction.asset?.toLowerCase() === props.currentCoinType?.toLowerCase() &&
              transaction.to?.toLowerCase() !== "0x1d71a281b418a1527cc820acd3930745cf8f9b73" &&
              transaction.to?.toLowerCase() !== "0xdd74396fb58c32247d8e2410e853a73f71053252"
            )
            .map((transaction, index) => (
              <li key={`${transaction.hash}-${index}`}>
                <p><strong>Amount:</strong> {transaction.value || 0} {transaction.asset} <strong>Type:</strong> {sentTransactions.includes(transaction) ? "Sent" : "Received"}</p>
                <p>
                  <strong>Tx Hash:</strong>
                  <a href={`${getExplorerUrl()}${transaction.hash}`} target="_blank" rel="noopener noreferrer">
                    {transaction.hash}
                  </a>
                </p>
              </li>
            ))}
        </ul>
      ) : (
        <p>No transactions found</p>
      )}
    </>
  );
}

export default TransactionHistory;
