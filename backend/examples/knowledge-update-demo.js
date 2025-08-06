/**
 * Knowledge Management Demo
 * Shows how the natural language knowledge update system works
 */

const knowledgeManager = require('../src/services/knowledgeManager');

// Simulate the knowledge update flow
async function demoKnowledgeUpdate() {
  console.log('🧠 Knowledge Management System Demo\n');
  
  // Example 1: New knowledge (no conflict)
  console.log('1️⃣ Adding new knowledge:');
  console.log('Input: "The WiFi password for Bedford Clubhouse is GolfNet2024"');
  
  const result1 = await simulateUpdate(
    "The WiFi password for Bedford Clubhouse is GolfNet2024"
  );
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('\n---\n');

  // Example 2: Updating existing knowledge (conflict detected)
  console.log('2️⃣ Updating existing knowledge:');
  console.log('Input: "The new phone number for Bedford Clubhouse is 902-555-9999"');
  
  const result2 = await simulateUpdate(
    "The new phone number for Bedford Clubhouse is 902-555-9999"
  );
  console.log('Result:', JSON.stringify(result2, null, 2));
  
  if (result2.requires_confirmation) {
    console.log('\n💬 System asks: ' + result2.message);
    console.log('👤 User confirms: Yes, replace it');
    
    // Simulate confirmation
    const confirmed = await simulateConfirmation(result2.update_id, result2.fact_id);
    console.log('\nConfirmation result:', JSON.stringify(confirmed, null, 2));
  }
  console.log('\n---\n');

  // Example 3: Complex natural language
  console.log('3️⃣ Complex natural language:');
  console.log('Input: "Hey, just wanted to let you know that starting next Monday, Dartmouth location will be open until 11pm on weekends"');
  
  const result3 = await simulateUpdate(
    "Hey, just wanted to let you know that starting next Monday, Dartmouth location will be open until 11pm on weekends"
  );
  console.log('Result:', JSON.stringify(result3, null, 2));
  console.log('\n---\n');

  // Example 4: Searching knowledge
  console.log('4️⃣ Searching knowledge:');
  console.log('Search query: "phone"');
  
  const searchResults = await simulateSearch("phone");
  console.log('Search results:', JSON.stringify(searchResults, null, 2));
  console.log('\n---\n');

  // Example 5: Getting all knowledge for an entity
  console.log('5️⃣ Getting all knowledge for Bedford Clubhouse:');
  
  const bedfordKnowledge = await simulateGetKnowledge("bedford_clubhouse");
  console.log('Current knowledge:', JSON.stringify(bedfordKnowledge, null, 2));
}

// Simulate the API calls
async function simulateUpdate(input) {
  // This simulates what the API endpoint would do
  return {
    // Mock response - in reality this would use GPT-4 to extract
    success: true,
    action: 'created',
    entity: 'bedford_clubhouse',
    fact_type: 'wifi_password',
    value: 'GolfNet2024',
    message: 'Successfully added wifi_password for bedford_clubhouse',
    
    // Or for conflicts:
    // requires_confirmation: true,
    // current_value: '902-555-1234',
    // new_value: '902-555-9999',
    // message: 'Bedford Clubhouse already has a phone_number: "902-555-1234". Replace with "902-555-9999"?'
  };
}

async function simulateConfirmation(updateId, factId) {
  return {
    success: true,
    action: 'updated',
    message: 'Successfully updated phone_number for bedford_clubhouse'
  };
}

async function simulateSearch(query) {
  return {
    query: query,
    count: 2,
    results: [
      {
        entity: 'Bedford Clubhouse',
        entity_key: 'bedford_clubhouse',
        fact_type: 'phone_number',
        fact_value: '902-555-9999',
        created_at: new Date()
      },
      {
        entity: 'Dartmouth Clubhouse',
        entity_key: 'dartmouth_clubhouse',
        fact_type: 'phone_number',
        fact_value: '902-555-8888',
        created_at: new Date()
      }
    ]
  };
}

async function simulateGetKnowledge(entityKey) {
  return {
    entity: entityKey,
    fact_type: 'all',
    facts: [
      {
        entity_name: 'Bedford Clubhouse',
        fact_type: 'phone_number',
        fact_value: '902-555-9999',
        last_updated: new Date()
      },
      {
        entity_name: 'Bedford Clubhouse',
        fact_type: 'wifi_password',
        fact_value: 'GolfNet2024',
        last_updated: new Date()
      },
      {
        entity_name: 'Bedford Clubhouse',
        fact_type: 'hours',
        fact_value: 'Mon-Fri 9am-9pm, Sat-Sun 8am-10pm',
        last_updated: new Date()
      }
    ]
  };
}

// Example of how the UI would work
function showUIFlow() {
  console.log('\n📱 UI Flow Example:\n');
  console.log('1. Staff member types in text box:');
  console.log('   "The door code for Dartmouth is now 4321"\n');
  
  console.log('2. System detects existing door code (1234)');
  console.log('   Shows dialog: "Dartmouth already has a door code: 1234"');
  console.log('   "Replace with 4321?" [Cancel] [Replace]\n');
  
  console.log('3. Staff clicks [Replace]');
  console.log('   System updates the knowledge and shows:');
  console.log('   ✅ "Successfully updated door code for Dartmouth"\n');
  
  console.log('4. Knowledge is immediately available to all parts of the system');
  console.log('   - Customer asks about door code');
  console.log('   - System responds with new code: 4321');
}

// Run the demo
console.log('Starting Knowledge Management Demo...\n');
demoKnowledgeUpdate().then(() => {
  showUIFlow();
  console.log('\n✅ Demo complete!');
}).catch(error => {
  console.error('Demo error:', error);
});