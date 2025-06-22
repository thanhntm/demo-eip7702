import {
  useAccount,
  useClient,
  useSendCalls,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { CONTRACT_CONFIG } from "./config";
import { Address, encodeFunctionData, erc20Abi, parseEther, parseUnits } from "viem";
import { useTaskStore } from "@/lib/store";
import { Call } from "viem";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useBatchCallContract = () => {
  const { sendCalls, status, data, error } = useSendCalls();
  const modules = useTaskStore((state) => state.modules);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient()
  const [loading, setLoading] = useState(false);

  // USDC 授权
  /*
     const usdcApproveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [
            '0x881d40237659c251811cec9c364ef91dc08d300c', // spender
            parseUnits('1000', 6) // USDC 6位小数
        ]
    })
    */

    const getBatchCalls = () => {
        
        // USDC 授权
        const usdcApproveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [
                '0x881d40237659c251811cec9c364ef91dc08d300c', // spender
                parseUnits('1000', 6) // USDC 6位小数
            ]
        })

        // USDT 授权
        const usdtApproveData = encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [
                '0xc7bBeC68d12a0d1830360F8Ec58fA599bA1b0e9b', // spender
                parseUnits('1000', 6) // USDT 6位小数
            ]
        })

        return [
            {
                data: usdcApproveData,
                to: '0xdac17f958d2ee523a2206206994597c13d831ec7' // USDC 合约地址
            },
            {
                data: usdtApproveData,
                to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' // USDT 合约地址
            }
        ] as Call[]
    }

  const write = async () => {
    if (!address) {
      throw new Error("Wallet not connected");
    }
    
    try {
      setLoading(true);
      
      const transactionData = modules.map((module, index) => {
        console.log('module write===>', module);
        if(module.customInstructions){
          return module.customInstructions;
        }
        // 构建交易数据
        const data = encodeFunctionData({
          abi: [module.method],
          functionName: module.method.name,
          args: module.method.inputs.length ? Object.values(module.params) : []
        });

        return [{
          data,
          to: module.contractAddress as Address,
          value: module.isPayable ? module.params.payValue : undefined
        }];
      });

      console.log("Transaction data:", transactionData);

      // 将二维数组转为一维数组
      const flatTransactionData = transactionData.flat();

      // 构建最终交易对象
      const transactions = flatTransactionData.map((tx) => ({
        data: tx.data,
        to: tx.to,
        // @ts-ignore
        value: tx.value ? tx.value : undefined
      }));

    console.log("Final transactions:", transactions);
    
      const result = await sendCalls({
        account: address,
        calls: transactions as Call[],
      });
      
      return result;
    } catch (error) {
      console.log('error===>', error);
      toast.error('Transaction Batch Failed!');
      throw error; // Re-throw to be caught by handleExecute
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(status === "success") {
      toast.success('Transaction Batch Success!');
    }
  }, [status])

  return {
    loading,
    write,
    status,
    data,
    error, // Include error in return
  };
};