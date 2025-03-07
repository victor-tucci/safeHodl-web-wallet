import React, { useState, useContext, useEffect } from "react";
import { Web3Context } from './Transfer';
import { feeTokens } from '../token/feeTokens';
import { chainIdandType,chainInfo } from "./chainInfo";
import { coinList } from "../token/coinList";

import {createUserOpETHTx, createUserOpERC20Tx,UserOperation,signAndSubmitUserOp, getUserOperationByHash} from './txCreation'
import { HexString } from "web3";
import Loading from "./popups/Loading";
import TransactionPopup from "./popups/TransactionPopup";
import ErrorPopup from "./popups/ErrorPupUp";
import { saveTransaction } from "./database/indexDb";

export default function Send(props: any) {
    const {web3, rawId, publicKeys, address,currentCoin, isSend } = props;
    console.log("current coin name",{currentCoin});
    const balance = useContext(Web3Context);

    //current network
    const [chainName, setChainName] = useState<string>('');
    
    // user input details
    const [toAddress, setToAddress] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [feeTokenOptions, setFeeTokenOptions] = useState<{ value: string; label: string }[]>([]);
    const [feeType, setFeeType] = useState<string>('');
    const [feeAsset, setFeeAsset] = useState<{ name: string; symbol: string; type: string; decimals: number; address: string }>();
    
    // validate user inputs
    const [isValidAddress, setIsValidAddress] = useState<boolean>(true);
    const [isValidAmount, setIsValidAmount] = useState<boolean>(true);
    const [isNext, setIsNext] = useState<boolean>(false);

    // Transaction(userOp) details
    const [aproxFee, setAproxFee] =  useState<string>('');
    const [isBalanceOk, setIsBalanceOk] = useState<boolean>(false);
    const [userOp, setUserOp] = useState<UserOperation>();

    const [txStatus, setTxStatus] = useState<String>('');
    const [txHash, setTxHash] = useState<HexString>('');
    const [errorMessage, setErrorMessage] = useState<String>('');


    // screens for userexperiance
    const [loading, setLoading] = useState<boolean>(false); 
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);

    //Findout the default chain also the available gas tokens
    useEffect(() => {
        if (!currentCoin?.chain) return;
        const chainId = currentCoin?.chain as keyof typeof chainIdandType;
        const chainName = chainIdandType[chainId] as keyof typeof chainInfo;
        setChainName(chainName);
        // Filter tokens that match the current chain
        const filteredTokens = feeTokens[chainName];

        // Map to dropdown options
        const tokenOptions = filteredTokens.map(token => ({
            value: token.name,
            label: token.symbol
        }));

        setFeeTokenOptions(tokenOptions);

        // Find default token of type 'COIN'
        const defaultFeeType = filteredTokens.find(token => token.type === "COIN");
        if (!defaultFeeType){
            console.error("There is no default fee type");
            return;
        }
        setFeeType(defaultFeeType?.name);
    }, [currentCoin]);

    //Set symbol
    useEffect(() => {
        if (!chainName || !feeType) return;
    
        const filteredTokens = feeTokens[chainName];
        const token = filteredTokens.find(token => token.name === feeType);
        setFeeAsset(token);
    }, [feeType, chainName]);

    // Monitor txStatus and show popup when it gets data
    useEffect(() => {
        if (txStatus) {
            setShowPopup(true);
        }
        if(errorMessage){
            setShowErrorPopup(true);
        }
    }, [txStatus, errorMessage]);

    const handleAddTransaction = async(status:String, result:any) =>{
        console.log("current coin name",{currentCoin});
        const transaction = {
            hash:result.transaction,
            from:result.userOp.sender,
            to: toAddress,
            amount: amount,
            type: currentCoin.name, // E.g., "deposit", "withdrawal"
            status:status
        };
        console.log("db transaction",transaction);
        await saveTransaction(rawId, transaction);
    }

    // Handle Loading
    const stopLoading = (userOp_:boolean) => {
        setLoading(false);
        if(!userOp_){
            setToAddress("");
            setAmount("");
        }    
    };

    // Handle Popups
    const handleClosePopup = () => {
        setShowPopup(false);
        setShowErrorPopup(false);
        setErrorMessage('');
        setTxStatus('');
        setTxHash('');
        const ignoredErrors = ["AA21 didn't pay prefund", "Insufficient balance."];
        const shouldIgnore = ignoredErrors.some(err => errorMessage.toString().includes(err));
        if (!shouldIgnore) {
            isSend(false);
        }
    };

    // Handle errors
    const handleError = (error:any,userOp_:boolean) => {
        console.log('Error occurred: ', error); // Log for debugging
        setErrorMessage(error);
        stopLoading(userOp_);
    };

    // calculate aprox fees
    useEffect(()=>{
        if(!isNext || !feeAsset) return;
        setLoading(true);
        console.log('next useEffect is called',feeType,feeAsset)
        setAproxFee('');
        console.log(feeAsset);
        if(!feeAsset)
            return;
        let response:any = '';
        const getUserOperation = async () => {
            try {
                if (currentCoin?.type === 'COIN') {
                    console.log('Native coin userOp generation......... fee', feeType);
                    const sendAmount = web3.utils.toWei(amount, 'ether');
                    response = await createUserOpETHTx(web3, address, publicKeys, toAddress, parseFloat(sendAmount) || 0, feeAsset);
                    console.log(response);

                }
                else{
                    console.log('ERC20 userOp generation......... fee', feeType);
                    const alltoken = coinList[chainName];
                    const token = alltoken.find(token => token.name === currentCoin.name);
                    if(!token){
                        console.error('unsupport coin from list')
                        return;
                    }
                    const sendToken = web3.utils.toWei(amount, token.decimals);
                    response = await createUserOpERC20Tx(web3, address, publicKeys, token.address, toAddress,  parseFloat(sendToken) || 0, feeAsset);
                    console.log(response);
                }

                if(!response.error)
                {
                    setAproxFee(response?.requiredFee);
                    setUserOp(response?.userOp);
                    console.log((Number(amount) + Number(response?.requiredFee)), balance)
                    if(currentCoin?.name === feeAsset.name){
                        if(balance && ((Number(amount) + Number(response?.requiredFee)) <= balance))
                            setIsBalanceOk(true);
                    }else{
                        if(balance && (Number(amount)) <= balance)
                            setIsBalanceOk(true);
                    }
                    setLoading(false);
                }else{
                    setAproxFee('');
                    setUserOp(undefined);
                    handleError(response.message,true);
                }
            } catch (err: any) {
                console.error('Error in getUserOperation:', err);
                handleError(err.message,false);
                setIsNext(false);
            }
        }

        getUserOperation();
    },[isNext,feeAsset]);

    // After entered address and amount
    function validateInputs() {
        let hasError = false;

        if (!web3.utils.isAddress(toAddress)) {
            setIsValidAddress(false);
            hasError = true;
        } else {
            setIsValidAddress(true);
        }

        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            setIsValidAmount(false);
            hasError = true;
        } else {
            
            if(balance && Number(amount) <= balance)
            {
                console.log(balance,(Number(amount) <= balance))
                setIsValidAmount(true);
            } else{
                setIsValidAmount(false);
                hasError = true;
            }            
        }

        if (!hasError) {
            setIsNext(true);
        }
    }

    async function handleNext() {
        await validateInputs();
    }

    const handleChainChange = (e: any) => {
        const newFeeType = e.target.value;
        setFeeType(newFeeType);
    };

    const handleCloseTransfer = () => {
        setIsNext(false);
    }

    const onConfirm = async () => {
        if(!userOp)
            return;
        try {
            const response = await signAndSubmitUserOp(web3, rawId, userOp);
            console.log(response);
            if (!response.error) {
                console.log('getUserOperationByHash function calling ...');
                for (let i = 0; true; i++) {
                    const res = await getUserOperationByHash(web3, response.opHash);
                    const result = res.result;
                    if (!(result === null) && result.status) {
                        console.log('Transaction status: ', result.status, result.transaction);
                        setTxStatus(result.status);
                        setTxHash(result.transaction);
                        if (['OnChain', 'Cancelled', 'Reverted'].includes(result.status)) {
                            if (result.status === 'Cancelled' || result.status === 'Reverted') {
                                // handleError(`Transaction is ${result.status}. Try again later`);
                            } else {
                                console.log('Transaction completed successfully.');
                            }
                            await handleAddTransaction(result.status, result);
                            break;
                        }
                    }

                    // Wait for a specified delay before retrying
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }else{
                console.log(response.message);
                handleError(response.message,false);
            }
        } catch (err: any) {
            console.error('Error in sendTx:', err);
            handleError(err.message,false);
        }
    }

    return (
        <>
            {loading ? (
                <Loading />
            ) : (
                <div>
                    {/* Header */}
                    <div style={header}>
                        {isNext ? (
                            <span style={arrow} onClick={handleCloseTransfer}>×</span>
                        ) : (
                            <span style={arrow} onClick={() => isSend(false)}>‹</span>
                        )}
                        <h2 style={title}>Transfer</h2>
                    </div>
    
                    {/* Transfer Section */}
                    {isNext ? (
                        <div>
                            <div style={amountSection}>
                                <h3>-{amount} {currentCoin?.symbol}</h3>
                            </div>
    
                            {/* Transfer Details */}
                            <div style={detailSection}>
                                <DetailRow label="Asset" value={currentCoin?.symbol} />
                                <DetailRow label="Wallet" address={address} />
                                <DetailRow label="To" address={toAddress} bold />
                                <DetailRow
                                    label="Gas Token(aprox)"
                                    selectOptions={feeTokenOptions}
                                    selectedValue={feeType}
                                    onChange={handleChainChange}
                                />
                                <DetailRow label="Network Fee" value={aproxFee + " " + feeAsset?.symbol} />
                            </div>
    
                            {/* Confirm Button */}
                            <button style={confirmButton} disabled={!(aproxFee && userOp && isBalanceOk)} onClick={onConfirm}>
                                Confirm
                            </button>
                        </div>
                    ) : (
                        <div style={transferContainer}>
                            <form style={addressContainer}>
                                <div style={inputFormField}>
                                    <input
                                        style={inputField}
                                        type="text"
                                        value={toAddress}
                                        onChange={(e) => setToAddress(e.target.value)}
                                        placeholder="Address or Domain Name"
                                    />
                                    {!isValidAddress && <p style={errorTextStyle}>Invalid address.</p>}
                                </div>
    
                                <div style={inputFormField}>
                                    <input
                                        style={inputField}
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={`${currentCoin?.name} Amount`}
                                    />
                                    {!isValidAmount && <p style={errorTextStyle}>Invalid amount.</p>}
                                </div>
                                <p>Available: {balance}</p>
                                <button
                                    style={{ ...submitButton, backgroundColor: (toAddress && amount) ? '#8b6b99' : '#cfcad2' }}
                                    disabled={!(toAddress && amount)}
                                    onClick={(e) => { e.preventDefault(); handleNext(); }}>
                                    Next
                                </button>
                            </form>
                        </div>
                    )}
                    <TransactionPopup
                        show={showPopup}
                        txStatus={txStatus}
                        txHash={txHash}
                        onClose={handleClosePopup}
                    />
                    <ErrorPopup
                    show={showErrorPopup}
                    message={errorMessage}
                    onClose={handleClosePopup}
                    />
                </div>
            )}
        </>
    );
    
}

// Helper Component for Displaying Details
const DetailRow = ({ label, value, address = '', bold = false, selectOptions, selectedValue, onChange }: any) => (
    <div style={detailRow}>
        <p style={detailLabel}>{label}</p>
        {selectOptions ? (
            <select value={selectedValue} onChange={onChange} style={feeOptionBox}>
                {selectOptions.map((option: any) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ) : (
            <p style={bold ? detailValueBold : detailValue}>{address || value}</p>
        )}
    </div>
);



// Styles
const amountSection: React.CSSProperties = {
    marginBottom: "20px",
};

const detailSection: React.CSSProperties = {
    textAlign: "left",
    marginBottom: "30px",
};

const confirmButton: React.CSSProperties = {
    width: "100%",
    padding: "15px",
    backgroundColor: "#8b6b99",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    cursor: "pointer",
};

const detailRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: 'center', // Ensure vertical alignment
    marginBottom: "10px",
    width: '100%',
};

const detailLabel: React.CSSProperties = {
    color: "#aaa",
    fontSize: "14px",
};

const detailValue: React.CSSProperties = {
    fontSize: "14px",
};

const detailValueBold: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "bold",
};

const errorTextStyle = {
    color: 'red',
    fontSize: '12px',
    marginTop: '4px',
};
const transferContainer: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px',
    //   lineHeight:'80px',
}

const addressContainer: React.CSSProperties = {
    width: '100%',
};

const inputFormField: React.CSSProperties = {
    marginBottom: '20px'
};

const inputField: React.CSSProperties = {
    paddingLeft: '15px',
    width: '100%',
    height: '55px',
    fontSize: '15px',
    boxSizing: 'border-box', // Ensure padding doesn't exceed width
    outline: 'none', // Prevents blue border
};

const submitButton: React.CSSProperties = {
    width: '100%',
    padding: '15px 0',
    borderRadius: '27px',
    fontSize: '20px',
    backgroundColor: '#e9ecef',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px', // Add space between input and button
    outline: 'none', // Prevents blue border
};

const arrow: React.CSSProperties = {
    color: '#000',
    fontSize: '40px',
    cursor: 'pointer', // Indicates it's clickable
    marginRight: '10px',
    paddingRight: '10px'
};

const title: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 0 30px',
    flexGrow: 1,
    textAlign: 'left'
}

const header: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px dotted lavender',
    marginBottom: '20px',
}

// **Dropdown Style**
const feeOptionBox: React.CSSProperties = {
    width: '20%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid black',
    textAlign: 'left',
    appearance: 'none',  // Remove default styling (for Safari)
};
