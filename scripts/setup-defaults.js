const { MongoClient } = require('mongodb');

async function setupDefaults() {
  const uri = 'mongodb+srv://medng1965:y9V7e9l4e2KiEmtJ@cluster0.dmm6ss0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    // Default pricing settings
    const defaultSettings = [
      {
        key: 'assistant_base_cost',
        value: 20,
        type: 'number',
        category: 'pricing',
        description: 'Base cost for creating an assistant ($)',
        isPublic: true,
        updatedBy: 'system-init',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'cost_per_minute_payg',
        value: 0.07,
        type: 'number',
        category: 'pricing',
        description: 'Cost per minute for pay-as-you-go users ($)',
        isPublic: true,
        updatedBy: 'system-init',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'cost_per_minute_overage',
        value: 0.05,
        type: 'number',
        category: 'pricing',
        description: 'Cost per minute for subscription overage ($)',
        isPublic: true,
        updatedBy: 'system-init',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'minimum_topup_amount',
        value: 5,
        type: 'number',
        category: 'pricing',
        description: 'Minimum credit top-up amount ($)',
        isPublic: true,
        updatedBy: 'system-init',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'initial_payg_charge',
        value: 25,
        type: 'number',
        category: 'pricing',
        description: 'Initial charge for pay-as-you-go activation ($)',
        isPublic: true,
        updatedBy: 'system-init',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'payg_initial_credits',
        value: 5,
        type: 'number',
        category: 'pricing',
        description: 'Initial credits included with PAYG activation ($)',
        isPublic: true,
        updatedBy: 'system-init',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert or update each setting
    for (const setting of defaultSettings) {
      await db.collection('systemsettings').updateOne(
        { key: setting.key },
        { $setOnInsert: setting },
        { upsert: true }
      );
      console.log(`✅ Set up pricing setting: ${setting.key} = ${setting.value}`);
    }

    console.log('✅ All default settings configured');

  } catch (error) {
    console.error('Error setting up defaults:', error);
  } finally {
    await client.close();
  }
}

setupDefaults();