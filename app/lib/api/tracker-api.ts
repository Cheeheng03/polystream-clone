import { usePrivy } from "@privy-io/react-auth";

interface TrackerApiInterface {
  getUsernameByWallet(walletAddress: string): Promise<string | null>;
  registerUser(
    walletAddress: string,
    username: string,
    referralCode?: string
  ): Promise<void>;
  checkUserExists(walletAddress: string): Promise<boolean>;
}

class TrackerAPI implements TrackerApiInterface {
  private static instance: TrackerAPI;
  private baseUrl = "/api";
  private getAccessToken: (() => Promise<string>) | null = null;

  static getInstance(): TrackerAPI {
    if (!TrackerAPI.instance) {
      TrackerAPI.instance = new TrackerAPI();
    }
    return TrackerAPI.instance;
  }

  // Set the access token getter function (called from React components)
  setAccessTokenGetter(getAccessToken: () => Promise<string>) {
    this.getAccessToken = getAccessToken;
  }

  async checkUserExists(walletAddress: string): Promise<boolean> {
    try {
      if (!walletAddress) {
        return false;
      }

      if (!this.getAccessToken) {
        throw new Error('Access token getter not set. Call setAccessTokenGetter first.');
      }

      const token = await this.getAccessToken();
      const response = await fetch(
        `${this.baseUrl}/users/${walletAddress}/username`,
        {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      // If we get a successful response, user exists
      if (response.ok) {
        const data = await response.json();
        const result =
          data &&
          typeof data.username === "string" &&
          data.username.trim() !== "";
        return result;
      }

      // If 404, user doesn't exist
      if (response.status === 404) {
        return false;
      }

      // For other errors, assume user doesn't exist
      return false;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      return false; // Return false on error to be safe
    }
  }

  async getUsernameByWallet(walletAddress: string): Promise<string | null> {
    try {
      if (!walletAddress) {
        return null;
      }

      if (!this.getAccessToken) {
        throw new Error('Access token getter not set. Call setAccessTokenGetter first.');
      }

      const token = await this.getAccessToken();
      const response = await fetch(
        `${this.baseUrl}/users/${walletAddress}/username`,
        {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // User not found, return null
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Return the username if it exists and is not empty
      if (data && typeof data.username === "string" && data.username.trim()) {
        return data.username.trim();
      }

      return null;
    } catch (error) {
      console.error("Error fetching username from tracker API:", error);
      return null; // Return null on error to fall back to default name
    }
  }

  async registerUser(
    walletAddress: string,
    username: string,
    referralCode?: string
  ): Promise<void> {
    try {
      if (!walletAddress || !username?.trim()) {
        throw new Error("Wallet address and username are required");
      }

      if (!this.getAccessToken) {
        throw new Error('Access token getter not set. Call setAccessTokenGetter first.');
      }

      const body: any = {
        wallet_address: walletAddress,
        username: username.trim(),
      };
      if (referralCode) {
        body.referral_code = referralCode;
      }

      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/users/register`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

    } catch (error) {
      console.error("Error registering username with tracker API:", error);
      throw error; // Re-throw to handle in calling code
    }
  }
}

// Export singleton instance
export const trackerAPI = TrackerAPI.getInstance();