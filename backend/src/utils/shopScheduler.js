const cron = require('node-cron');
const Shop = require('../models/Shop');
const User = require('../models/User');

class ShopScheduler {
  constructor(io) {
    this.io = io;
    this.task = null;
  }

  // Start the scheduler
  start() {
    // Run every hour
    this.task = cron.schedule('0 * * * *', async () => {
      console.log('[ShopScheduler] Running subscription check...');
      await this.checkExpiredSubscriptions();
    });

    console.log('[ShopScheduler] Started - checking subscriptions every hour');
  }

  // Stop the scheduler
  stop() {
    if (this.task) {
      this.task.stop();
      console.log('[ShopScheduler] Stopped');
    }
  }

  // Check and deactivate expired shops
  async checkExpiredSubscriptions() {
    try {
      const expiredShops = await Shop.getExpiredShops();
      
      console.log(`[ShopScheduler] Found ${expiredShops.length} expired shops`);

      for (const shop of expiredShops) {
        console.log(`[ShopScheduler] Deactivating shop: ${shop.shopName} (${shop.shopCode})`);
        
        // Deactivate the shop
        shop.subscription.autoDeactivated = true;
        await shop.deactivateShop(null, 'subscription_expired', 'Auto-deactivated by scheduler');

        // Emit socket event to kick out all users
        if (this.io) {
          this.io.to(`shop:${shop._id}`).emit('shop-deactivated', {
            shopId: shop._id,
            shopName: shop.shopName,
            reason: 'subscription_expired',
            message: 'Your shop subscription has expired. Please contact administrator.'
          });
        }

        // Optionally: Send email notification to shop admin
        // await this.sendDeactivationNotification(shop);
      }

      return expiredShops.length;
    } catch (error) {
      console.error('[ShopScheduler] Error checking subscriptions:', error);
      return 0;
    }
  }

  // Manual check (can be called via API)
  async manualCheck() {
    return await this.checkExpiredSubscriptions();
  }

  // Get shops expiring soon
  async getExpiringShops(days = 7) {
    try {
      return await Shop.getExpiringShops(days);
    } catch (error) {
      console.error('[ShopScheduler] Error getting expiring shops:', error);
      return [];
    }
  }
}

module.exports = ShopScheduler;