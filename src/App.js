import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ClipLoader from "react-spinners/ClipLoader";
import './App.css';
import abi from "./utils/WavePortal.json";

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveCount, setWaveCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isMining, setIsMining] = useState(false);
  
  const contractAddress = "0x527f95bE99a4D690Fa9e00Ce906c540affEB1C5d";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves();
        // console.log("all waves cleaned: ", allWaves);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }

  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.waveCount();
        setWaveCount(count.toNumber());

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000});
        setIsMining(true);
        setMessage("");
        await waveTxn.wait();
        console.log("mined -- ", waveTxn.hash);

        count = await wavePortalContract.waveCount();
        setWaveCount(count.toNumber());
        await getAllWaves();

        setIsMining(false);  //transaction complete

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }

  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.waveCount();
        setWaveCount(count.toNumber());

        const waves = await wavePortalContract.getAllWaves();
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);

      } else {
        console.log("ethereum object doesn't exist")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        }
      ]);
    };

    if(window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if(wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">
      {/*<div className="header">
          <ul class="navbar">
                <li><a href="">Home</a></li>
                <li><a href="">About</a></li>
          </ul>
      </div>*/}
      <div className="dataContainer">
        
        <div className="bio">
          <h1> 👋 Hey there! </h1>
          Welcome to my wave portal!
          Connect your Ethereum wallet and wave at me!
        </div>
        

        {/*
        * textarea disabled when wallet not connected;
        */}
        <textarea maxlength={100} placeholder="maximum 100 characters" disabled={!currentAccount} value={message} onChange={e => setMessage(e.target.value)}/>


        {/*
        * button to send the message;
        * disabled when no text in the textarea;
        */}
        <button className="waveButton" disabled={!message} onClick={wave}>
          Wave at Me
        </button>

        


        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}


        {/*
        * shows the spinner when mining
        */}
        {isMining && (
          <div className="spinner">
            <span id="spinnerSpan">mining... </span>
            <ClipLoader color="grey" loading={true} size={12} />
          </div>
        )}


        {/*
        * heading showing total number of waves so far;
        * hidden while awaiting transaction to complete;
        */}
        {!isMining && (
          <h3 id="total-waves" style={{display: (!currentAccount? "none" : "inline-block")}}>Total Waves: {waveCount} </h3>
        )}


        {/*
        * displays all the waves/messages so far;
        * hidden while awaiting transaction to complete;
        */}
        <div id="allMessagesContainer">
          {allWaves.map((wave, index) => {
          return (
            <div>
              <div className="allMessages" key={index}>
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
                <hr/>
              </div>
            </div>
          );
        })}
        </div>

      </div>
    </div>
  );
}
