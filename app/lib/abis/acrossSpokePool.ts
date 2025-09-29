export const ACROSS_SPOKE_POOL_ABI = [
    {
        name: "depositV3",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "depositor", type: "address" },
            { name: "recipient", type: "address" },
            { name: "inputToken", type: "address" },
            { name: "outputToken", type: "address" },
            { name: "inputAmount", type: "uint256" },
            { name: "outputAmount", type: "uint256" },
            { name: "destinationChainId", type: "uint256" },
            { name: "exclusiveRelayer", type: "address" },
            { name: "quoteTimestamp", type: "uint32" },
            { name: "fillDeadline", type: "uint32" },
            { name: "exclusivityParameter", type: "uint32" },
            { name: "message", type: "bytes" }
        ],
        outputs: []
    }
] as const;