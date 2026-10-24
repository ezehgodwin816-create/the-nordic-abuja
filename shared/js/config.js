/**
 * Nordic Group — shared config (multi-hotel)
 * Same Supabase project as your working Nordic site.
 * Replace Paystack key with yours when ready.
 */
window.NORDIC_CONFIG = {
  supabaseUrl: 'https://rzjvhfnizwckzbdawrbn.supabase.co',
  supabaseAnonKey: 'sb_publishable_FRKM94YJWbL1lSKGCIoRkg_oWuembob',
  // Set your Paystack public key (pk_test_... or pk_live_...)
  paystackPublicKey: window.NORDIC_PAYSTACK_PUBLIC_KEY || '',
  hotels: {
    joyous: {
      id: 'joyous',
      name: 'Joyous Hotel',
      location: 'Nyanya, Abuja',
      slug: 'joyous',
      theme: 'warm',
      path: '../joyous/',
      rooms: [
        { id: 'standard', name: 'Standard', price: 15000, desc: 'Clean and comfortable' },
        { id: 'deluxe', name: 'Deluxe', price: 22000, desc: 'Extra space and comfort' },
        { id: 'suite', name: 'Suite', price: 35000, desc: 'Our best rooms' }
      ]
    },
    'dj-annex': {
      id: 'dj-annex',
      name: 'DJ Annex Hotel',
      location: 'Abacha Road',
      slug: 'dj-annex',
      theme: 'dark',
      path: '../dj-annex/',
      rooms: [
        { id: 'classic', name: 'Classic', price: 18000, desc: 'Modern essentials' },
        { id: 'executive', name: 'Executive', price: 28000, desc: 'Desk and extra space' },
        { id: 'premium', name: 'Premium', price: 40000, desc: 'Top comfort' }
      ]
    },
    jimmyland: {
      id: 'jimmyland',
      name: 'Jimmyland Hotel',
      location: 'Abacha Road, Mararaba',
      slug: 'jimmyland',
      theme: 'vibrant',
      path: '../jimmyland/',
      rooms: [
        { id: 'standard', name: 'Standard', price: 16000, desc: 'Comfortable and straightforward' },
        { id: 'deluxe', name: 'Deluxe', price: 25000, desc: 'More space' },
        { id: 'family', name: 'Family', price: 38000, desc: 'Room for everyone' }
      ]
    }
  }
};

window.NORDIC_PAYSTACK_PUBLIC_KEY = window.NORDIC_CONFIG.paystackPublicKey;
