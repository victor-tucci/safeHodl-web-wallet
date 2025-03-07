import React, { useState } from "react";
import { useLocation } from 'react-router-dom';
import setting from '../assets/setting.png';
import notification from '../assets/notification.png';
import home from '../assets/home.png';
import discover from '../assets/discover.png';
import bitcoinLogo from '../assets/bitcoin-logo.png';

import  Transfer from "../components/Transfer";

function User() {
    const [isTransfer, setIsTransfer] = useState<Boolean>(false);
   
    const [searchQuery, setSearchQuery] = useState<any>("");
    const [buyBDXDomain, setBuyBDXDomain] = useState<Boolean>(false);
    const [importToken, setImportToken] = useState<Boolean>(false);
    console.log(importToken,buyBDXDomain);
    const [isHistory, setIsHistory] = useState<Boolean>(false);

    const [currentCoin, setCurrentCoin] = useState<any>('');
    
    const location = useLocation();
    const {name,rawId,publicKeys} = location.state || {}; // Safely destructure state
    console.log(name, rawId, publicKeys);

    // Mock data for crypto items
    const cryptoItems = [
        // { symbol: "BDX", name: "Beldex", type: "COIN", chain:'56', price: "$0.0789", change: "-0.14%", icon: bitcoinLogo, color: "red" },
        { symbol: "MATIC", name: "Amoy", type: "COIN", chain:'0x13882', price: "$101,234", change: "-0.14%", icon: bitcoinLogo, color: "red" },
        { symbol: "SAR", name: "Sarvy", type: "TOKEN", chain:'0x13882', price: "$0.89", change: "-2.56%", icon: bitcoinLogo, color: "red" },
        { symbol: "RON", name: "Ronin", type: "TOKEN", chain:'0x13882', price: "$0.0002124", change: "-10.23%", icon: bitcoinLogo, color: "red" },
        { symbol: "ETH", name: "Sepolia", type: "COIN", chain:'0xaa36a7', price: "$3,200", change: "+1.25%", icon: bitcoinLogo, color: "green" },
        { symbol: "TT", name: "Toretto", type: "TOKEN", chain:'0xaa36a7', price: "$0.89", change: "-2.56%", icon: bitcoinLogo, color: "red" },

    ];

    function processTransaction(index: any) {
        console.log(cryptoItems[index]);
        setCurrentCoin(cryptoItems[index])
        setIsTransfer(true);
    }

    function handleBackClick() {
        setIsTransfer(false);
    }
    return (
        <div className="container"> {(isTransfer) ?
            <Transfer userInfo={location.state} currentCoin={currentCoin} handleBackClick={handleBackClick}/> :
            <div style={containerStyle}>
                <div style={mainContents}>
                    {/* Header section*/}
                    <div style={header}>
                        <img src={setting}
                            style={Icon}
                            alt="Settings Icon" />
                        <h3>{name}</h3>
                        <img src={notification}
                            style={Icon}
                            alt="Notification Icon" />
                    </div>

                    {/* Search token section*/}
                    <div style={searchContainer}>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={searchInput}
                        />
                        <span style={searchIcon}>🔍</span>
                    </div>

                    {/* Buy BDX domain section and import token*/}
                    <div style={tokenContainer}>
                        <button style={button} onClick={() => { setBuyBDXDomain(true) }}>Buy BDX Domain</button>
                        <button style={button} onClick={() => { setImportToken(true) }}>Import Token</button>
                    </div>

                    {/* Crypto and History section*/}
                    <div style={cryptoHistoryContainer}>
                        <div style={cryptoHistoryHeader}>
                            <p style={{ ...cryptSec, borderBottom: isHistory ? 'none' : '2px solid black' }} onClick={() => { setIsHistory(false); }}>Crypto</p>
                            <p style={{ ...historySec, borderBottom: isHistory ? '2px solid black' : 'none' }} onClick={() => { setIsHistory(true); }}>History</p>
                        </div>
                        <div style={cryptoHistory}>
                            {!isHistory ? <div style={cryptoListContainer}>
                                {cryptoItems.map((item, index) => (
                                    <div key={index} style={cryptoCardStyle} onClick={() => { processTransaction(index) }}>
                                        <img src={item.icon} style={cryptoIconStyle} alt={item.symbol} />
                                        <div>
                                            <strong>{item.symbol}</strong>
                                            <p>{item.name}</p>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <strong>{item.price}</strong>
                                            <p style={{ color: item.color }}>{item.change}</p>
                                        </div>
                                    </div>
                                ))}
                            </div> : <div>
                                <p>history</p>
                            </div>
                            }
                        </div>

                    </div>
                </div>
                {/* Footer section*/}
                <div style={footerContainer}>
                    <img src={home}
                        style={Icon}
                        alt="home Icon" />
                    <img src={discover}
                        style={Icon}
                        alt="discover Icon" />
                </div>
            </div>
        }
        </div>
    )

}

// Styles
const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minHeight:'100vh'
};

const mainContents = {
    flex: 1, // Pushes footer to the bottom
}
const footerContainer: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '10px 0',
    backgroundColor: '#f8f8f8',
    // position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTop: '1px solid #ccc',
}

const cryptoHistoryContainer: React.CSSProperties = {
}

const cryptSec: React.CSSProperties = {
    width: '100%',
    paddingBottom: '15px'
}

const historySec: React.CSSProperties = {
    width: '100%',
    paddingBottom: '15px'
}

const cryptoHistory: React.CSSProperties = {
    textAlign: 'left',
    minHeight:'60vh'
}

const cryptoHistoryHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '20px',
    padding: '0 30px',
}
const header: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px dotted lavender',
    marginBottom: '20px',
}

const Icon: React.CSSProperties = {
    width: '30px',
    // borderRadius: '10px' 
}

const searchContainer: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    margin: '20px',
    marginBottom: '20px',
    border: '2px dotted lavender',

};

const searchInput = {
    width: '100%',
    padding: '10px 15px',
    borderRadius: '30px',
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: '16px',
    paddingLeft: '40px', // Add space for the search icon
};

const searchIcon: React.CSSProperties = {
    position: 'absolute',
    left: '15px',
    fontSize: '18px',
    color: '#888',
};

const tokenContainer: React.CSSProperties = {
    display: 'flex',
    alignItems: 'left',
    margin: '20px',
    justifyContent: 'space-between',
    marginBottom: '20px',
    border: '2px dotted lavender',

};
const cryptoListContainer: React.CSSProperties = {
    // marginBottom: "30px",
    overflowY: 'auto',
    height: '550px'
};

const cryptoCardStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "5px",
    margin: "10px 0",
    backgroundColor: "#f2f2f2",
    borderRadius: "10px",
    fontSize: '13px',
};

const cryptoIconStyle: React.CSSProperties = {
    width: "30px",
    height: "30px",
    marginRight: "10px",
    backgroundColor: "#8b6b99",
    borderRadius: "50px",
    padding: '5px'
};

const button: React.CSSProperties = {
    backgroundColor: '#8b6b99',
    color: '#fff',
    width: '30%',
    outline: 'none',
    borderRadius: '50px'
}
export default User;