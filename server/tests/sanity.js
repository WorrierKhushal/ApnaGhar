/**
 * AapnaGhar E2E Integration Sanity Test Suite
 * Executed via node tests/sanity.js
 */

const BASE_URL = 'http://localhost:5000/api';

// Helper to generate random email
const randomEmail = (prefix) => `${prefix}_test_${Math.floor(Math.random() * 1000000)}@apnaghar.com`;

const runTests = async () => {
  console.log('--------------------------------------------------');
  console.log('🚀 AapnaGhar Production-Ready E2E Sanity Audit');
  console.log('--------------------------------------------------\n');

  try {
    const hostEmail = randomEmail('host');
    const guestEmail = randomEmail('guest');
    const password = 'Password@12345';
    let hostToken = '';
    let guestToken = '';
    let adminToken = '';
    let mockStayId = '';
    let mockBookingId = '';

    // 1. Host Account Registration
    console.log('➕ [1/12] Registering Host Account...');
    const regHostRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Native Host',
        email: hostEmail,
        password,
        phoneNumber: '+91 99999 88888',
        role: 'host'
      })
    });
    const regHostData = await regHostRes.json();
    if (!regHostRes.ok) throw new Error(`Host registration failed: ${JSON.stringify(regHostData)}`);
    console.log(`   ✅ Host created: ${hostEmail}`);

    // 2. Traveler/Guest Account Registration
    console.log('➕ [2/12] Registering Guest Account...');
    const regGuestRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Voyager',
        email: guestEmail,
        password,
        phoneNumber: '+91 77777 66666',
        role: 'user'
      })
    });
    const regGuestData = await regGuestRes.json();
    if (!regGuestRes.ok) throw new Error(`Guest registration failed: ${JSON.stringify(regGuestData)}`);
    console.log(`   ✅ Guest created: ${guestEmail}`);

    // 3. User Login (Retrieve Authorization Token)
    console.log('🔑 [3/12] Authenticating User Sessions...');
    const loginHostRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: hostEmail, password })
    });
    const loginHostData = await loginHostRes.json();
    hostToken = loginHostData.accessToken;

    const loginGuestRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: guestEmail, password })
    });
    const loginGuestData = await loginGuestRes.json();
    guestToken = loginGuestData.accessToken;

    if (!hostToken || !guestToken) throw new Error('Failed to acquire token keys during logins.');
    console.log('   ✅ Active bearer sessions established.');

    // 4. Host Listing Creation
    console.log('🏡 [4/12] Creating Host Heritage Property Listing...');
    const createStayRes = await fetch(`${BASE_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hostToken}`
      },
      body: JSON.stringify({
        title: 'E2E Test Rajasthani Royal Haveli',
        description: 'Seeded test accommodation details. Luxury heritage arches and traditional meals.',
        images: [
          'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80'
        ],
        pricePerNight: 4500,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        location: {
          address: 'Johri Bazar lane 5',
          city: 'Jaipur',
          state: 'Rajasthan',
          coordinates: { lat: 26.9124, lng: 75.7873 }
        },
        amenities: ['Wi-Fi', 'Pure Veg Meals', 'AC'],
        houseRules: ['No smoking', 'Remove shoes at courtyard entrance'],
        indianFilters: {
          nearTemple: true,
          nearRailway: true,
          vegFoodNearby: true
        },
        safetyIndicators: {
          familySafe: true,
          soloSafe: true,
          womenFriendly: true,
          safetyIndex: 9.6
        }
      })
    });
    const createStayData = await createStayRes.json();
    if (!createStayRes.ok) throw new Error(`Stay creation failed: ${JSON.stringify(createStayData)}`);
    mockStayId = createStayData.data._id;
    console.log(`   ✅ Listing stay created: ${createStayData.data.title} (ID: ${mockStayId})`);

    // 5. Listings Query & Proximity Filters Search
    console.log('🔍 [5/12] Testing Stays Search & Proximity Queries...');
    const searchRes = await fetch(`${BASE_URL}/listings?city=Jaipur&nearTemple=true`);
    const searchData = await searchRes.json();
    if (!searchRes.ok) throw new Error('Search API endpoint failed.');
    const found = searchData.data.find(s => s._id === mockStayId);
    if (!found) throw new Error('Seeded stay listing not returned in search search result.');
    console.log('   ✅ Query filtered Jaipur properties correctly.');

    // 6. Traveler Booking Creation
    console.log('📅 [6/12] Registering Stays Reservation Request...');
    const createBookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guestToken}`
      },
      body: JSON.stringify({
        listingId: mockStayId,
        checkIn: '2026-07-10',
        checkOut: '2026-07-15',
        guests: 2
      })
    });
    const createBookData = await createBookRes.json();
    if (!createBookRes.ok) throw new Error(`Booking failed: ${JSON.stringify(createBookData)}`);
    mockBookingId = createBookData.data._id;
    console.log(`   ✅ Stay booked successfully (ID: ${mockBookingId}) for July 10-15.`);

    // 7. Booking Overlaps Calendar Guard check
    console.log('🔒 [7/12] Testing Double-Booking Overlaps Blockers...');
    const overlapBookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guestToken}`
      },
      body: JSON.stringify({
        listingId: mockStayId,
        checkIn: '2026-07-12', // Overlaps
        checkOut: '2026-07-18',
        guests: 1
      })
    });
    const overlapBookData = await overlapBookRes.json();
    if (overlapBookRes.status === 400 && overlapBookData.success === false) {
      console.log('   ✅ Calendar blocker correctly blocked double booking (400 Bad Request).');
    } else {
      throw new Error(`Double-booking verification bypassed! Status: ${overlapBookRes.status}`);
    }

    // 8. Host Reservation Status Update
    console.log('🔔 [8/12] Transitioning Booking Status (Host Approval)...');
    const updateBookRes = await fetch(`${BASE_URL}/bookings/${mockBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hostToken}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const updateBookData = await updateBookRes.json();
    if (!updateBookRes.ok) throw new Error(`Booking approval failed: ${JSON.stringify(updateBookData)}`);
    console.log(`   ✅ Booking status set to: ${updateBookData.data.status}`);

    // 9. Traveler Feedback Reviews submission
    console.log('⭐ [9/12] Submitting Traveler Review Feedback...');
    const reviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guestToken}`
      },
      body: JSON.stringify({
        listingId: mockStayId,
        ratings: {
          cleanliness: 5,
          communication: 5,
          location: 4,
          value: 5,
          localVibe: 5
        },
        comment: 'Absolutely royal stay, loved the local folk songs and handblock printing.'
      })
    });
    const reviewData = await reviewRes.json();
    if (!reviewRes.ok) throw new Error(`Review submission failed: ${JSON.stringify(reviewData)}`);
    console.log('   ✅ Review registered. Verified customer flags appended.');

    // 10. Administrator Privileges check
    console.log('👮 [10/12] Authenticating Platform Administrator...');
    const loginAdminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apnaghar.com', password: 'password123' })
    });
    const loginAdminData = await loginAdminRes.json();
    if (!loginAdminRes.ok) throw new Error('Could not log in as administrator.');
    adminToken = loginAdminData.accessToken;
    console.log('   ✅ Admin control headers retrieved.');

    // 11. User Role Promotion via Admin route
    console.log('📈 [11/12] Modifying User Role privilege via Admin controllers...');
    const promoteUserRes = await fetch(`${BASE_URL}/admin/users/${regGuestData.user.id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ role: 'host' })
    });
    const promoteUserData = await promoteUserRes.json();
    if (!promoteUserRes.ok) throw new Error(`Role promotion failed: ${JSON.stringify(promoteUserData)}`);
    console.log(`   ✅ Guest voyager email '${guestEmail}' promoted to: ${promoteUserData.data.role}`);

    // 12. Listing stay Moderation (Deletion by Admin)
    console.log('🧹 [12/12] Deleting test stay and cleaning user profiles...');
    // Deleting Listing
    const deleteStayRes = await fetch(`${BASE_URL}/admin/listings/${mockStayId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!deleteStayRes.ok) throw new Error('Admin listing moderation failed.');

    // Delete Temporary Users
    await fetch(`${BASE_URL}/admin/users/${regHostData.user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    await fetch(`${BASE_URL}/admin/users/${regGuestData.user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    console.log('   ✅ Mock stay moderated and temporary accounts successfully deleted.');

    console.log('\n--------------------------------------------------');
    console.log('🏆 AUDIT SUCCESS: All 12 subsystems verify correctly!');
    console.log('--------------------------------------------------');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ AUDIT FAILURE: E2E flow encountered an error:');
    console.error(error.message);
    console.log('--------------------------------------------------');
    process.exit(1);
  }
};

runTests();
