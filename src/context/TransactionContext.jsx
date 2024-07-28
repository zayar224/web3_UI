import React, {useEffect, useState} from 'react';
import {ethers} from 'ethers';
import {contractABI, contractAddress} from "../utils/constants";

export const TransactionContext = React.createContext();

const getEthereumContract = () => {
    const {ethereum} = window;
    if (!ethereum) throw new Error("Ethereum object not found. Make sure you have MetaMask installed.");

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);
    return transactionContract;
};

export const TransactionProvider = ({children}) => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [formData, setFormData] = useState({addressTo: '', amount: '', keyword: '', message: ''});
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));

    const handleChange = (e, name) => {
        setFormData((prevState) => ({...prevState, [name]: e.target.value}));
    };

    const checkIfWalletIsConnected = async () => {
        try {
            const {ethereum} = window;
            if (!ethereum) {
                alert("Please install MetaMask");
                return;
            }

            const accounts = await ethereum.request({method: 'eth_accounts'});

            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                // getAllTransactions();
            } else {
                console.log("No accounts found");
            }
        } catch (error) {
            console.error("An error occurred while checking if wallet is connected:", error);
        }
    };

    const connectWallet = async () => {
        try {
            const {ethereum} = window;
            if (!ethereum) {
                alert("Please install MetaMask");
                return;
            }

            const accounts = await ethereum.request({method: 'eth_requestAccounts'});
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.error("An error occurred while connecting wallet:", error);
        }
    };

    const sendTransaction = async () => {
        try {
            const {ethereum} = window;
            if (!ethereum) {
                alert("Please install MetaMask");
                return;
            }

            const {addressTo, amount, keyword, message} = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.parseUnits(amount, 'ether');

            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x186A0', // 100,000 Gwei
                    value: parsedAmount._hex, // Correct method to get hex string
                }],
            });

            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionCount();
            setTransactionCount(transactionCount.toNumber());
        } catch (error) {
            console.error("An error occurred while sending transaction:", error);
        }
    };

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    return (
        <TransactionContext.Provider
            value={{connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction, isLoading}}>
            {children}
        </TransactionContext.Provider>
    );
};
