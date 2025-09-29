import { usePrivy } from "@privy-io/react-auth";

interface RewardsData {
  wallet_address: string;
  username: string;
  has_deposited: boolean;
  referral_code: string;
  total_points: number;
  points_breakdown: {
    deposit_points: number;
    accrual_points: number;
    referral_points: number;
  };
  referral_stats: {
    referred_users_count: number;
    referral_points_earned: number;
  };
  tasks: {
    first_deposit: {
      completed: boolean;
      reward: string;
    };
    accrual_participation: {
      completed: boolean;
      reward: string;
    };
    referral_program: {
      completed: boolean;
      reward: string;
    };
  };
}

interface RewardApiInterface {
  getUserRewards(walletAddress: string): Promise<RewardsData>;
}

class RewardAPI implements RewardApiInterface {
  private static instance: RewardAPI;
  private baseUrl = "/api";
  private getAccessToken: (() => Promise<string>) | null = null;

  static getInstance(): RewardAPI {
    if (!RewardAPI.instance) {
      RewardAPI.instance = new RewardAPI();
    }
    return RewardAPI.instance;
  }

  // Set the access token getter function (called from React components)
  setAccessTokenGetter(getAccessToken: () => Promise<string>) {
    this.getAccessToken = getAccessToken;
  }

  async getUserRewards(walletAddress: string): Promise<RewardsData> {
    try {
      if (!walletAddress) {
        throw new Error("Wallet address is required");
      }

      if (!this.getAccessToken) {
        throw new Error('Access token getter not set. Call setAccessTokenGetter first.');
      }

      const token = await this.getAccessToken();
      const response = await fetch(
        `${this.baseUrl}/users/${walletAddress}/rewards`,
        {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching rewards:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const rewardAPI = RewardAPI.getInstance();