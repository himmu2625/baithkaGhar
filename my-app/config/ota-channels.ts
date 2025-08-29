// OTA Channel Configuration

export interface OTAChannelConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  website: string;
  logo?: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'email';
    required: boolean;
    placeholder?: string;
    description?: string;
  }[];
  documentation?: string;
  testEndpoint?: string;
}

export const OTA_CHANNELS: OTAChannelConfig[] = [
  {
    id: 'booking-com',
    name: 'Booking.com',
    type: 'booking_com',
    description: 'World\'s leading digital travel platform',
    website: 'https://www.booking.com',
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Your Booking.com username'
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Your Booking.com password'
      },
      {
        name: 'property_id',
        label: 'Property ID',
        type: 'text',
        required: true,
        placeholder: 'Your property ID on Booking.com'
      }
    ],
    documentation: 'https://developers.booking.com/api/'
  },
  {
    id: 'expedia',
    name: 'Expedia',
    type: 'expedia',
    description: 'Global travel booking website',
    website: 'https://www.expedia.com',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your Expedia API key'
      },
      {
        name: 'secret_key',
        label: 'Secret Key',
        type: 'password',
        required: true,
        placeholder: 'Your Expedia secret key'
      },
      {
        name: 'hotel_id',
        label: 'Hotel ID',
        type: 'text',
        required: true,
        placeholder: 'Your hotel ID on Expedia'
      },
      {
        name: 'endpoint',
        label: 'API Endpoint',
        type: 'url',
        required: false,
        placeholder: 'https://api.expedia.com'
      }
    ],
    documentation: 'https://developers.expediagroup.com/'
  },
  {
    id: 'agoda',
    name: 'Agoda',
    type: 'agoda',
    description: 'Asia\'s leading online hotel booking website',
    website: 'https://www.agoda.com',
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Your Agoda username'
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Your Agoda password'
      },
      {
        name: 'hotel_code',
        label: 'Hotel Code',
        type: 'text',
        required: true,
        placeholder: 'Your hotel code on Agoda'
      }
    ]
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    type: 'airbnb',
    description: 'Global marketplace for short-term homestays',
    website: 'https://www.airbnb.com',
    fields: [
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Your Airbnb client ID'
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        placeholder: 'Your Airbnb client secret'
      },
      {
        name: 'listing_id',
        label: 'Listing ID',
        type: 'text',
        required: true,
        placeholder: 'Your listing ID on Airbnb'
      }
    ]
  },
  {
    id: 'hotels-com',
    name: 'Hotels.com',
    type: 'hotels_com',
    description: 'Leading hotel booking website',
    website: 'https://www.hotels.com',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your Hotels.com API key'
      },
      {
        name: 'property_id',
        label: 'Property ID',
        type: 'text',
        required: true,
        placeholder: 'Your property ID on Hotels.com'
      }
    ]
  },
  {
    id: 'priceline',
    name: 'Priceline',
    type: 'priceline',
    description: 'Online travel booking service',
    website: 'https://www.priceline.com',
    fields: [
      {
        name: 'partner_id',
        label: 'Partner ID',
        type: 'text',
        required: true,
        placeholder: 'Your Priceline partner ID'
      },
      {
        name: 'api_key',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your Priceline API key'
      },
      {
        name: 'hotel_id',
        label: 'Hotel ID',
        type: 'text',
        required: true,
        placeholder: 'Your hotel ID on Priceline'
      }
    ]
  },
  {
    id: 'trivago',
    name: 'Trivago',
    type: 'trivago',
    description: 'Hotel search and price comparison website',
    website: 'https://www.trivago.com',
    fields: [
      {
        name: 'advertiser_id',
        label: 'Advertiser ID',
        type: 'text',
        required: true,
        placeholder: 'Your Trivago advertiser ID'
      },
      {
        name: 'api_key',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your Trivago API key'
      }
    ]
  },
  {
    id: 'hostelworld',
    name: 'Hostelworld',
    type: 'hostelworld',
    description: 'Leading hostel booking platform',
    website: 'https://www.hostelworld.com',
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'Your Hostelworld username'
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Your Hostelworld password'
      },
      {
        name: 'hostel_id',
        label: 'Hostel ID',
        type: 'text',
        required: true,
        placeholder: 'Your hostel ID on Hostelworld'
      }
    ]
  },
  {
    id: 'kayak',
    name: 'Kayak',
    type: 'kayak',
    description: 'Travel search engine',
    website: 'https://www.kayak.com',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your Kayak API key'
      },
      {
        name: 'hotel_id',
        label: 'Hotel ID',
        type: 'text',
        required: true,
        placeholder: 'Your hotel ID on Kayak'
      }
    ]
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    type: 'makemytrip',
    description: 'Leading online travel company in India',
    website: 'https://www.makemytrip.com',
    fields: [
      {
        name: 'vendor_id',
        label: 'Vendor ID',
        type: 'text',
        required: true,
        placeholder: 'Your MakeMyTrip vendor ID'
      },
      {
        name: 'api_key',
        label: 'API Key',
        type: 'text',
        required: true,
        placeholder: 'Your MakeMyTrip API key'
      },
      {
        name: 'hotel_code',
        label: 'Hotel Code',
        type: 'text',
        required: true,
        placeholder: 'Your hotel code on MakeMyTrip'
      }
    ]
  }
];

export const getOTAChannelConfig = (channelId: string): OTAChannelConfig | undefined => {
  return OTA_CHANNELS.find(channel => channel.id === channelId);
};

export const getOTAChannelsByType = (type: string): OTAChannelConfig[] => {
  return OTA_CHANNELS.filter(channel => channel.type === type);
};

export const getAllOTAChannels = (): OTAChannelConfig[] => {
  return OTA_CHANNELS;
};

// Additional exports for compatibility
export const getAllChannels = getAllOTAChannels;
export const getChannelsByCategory = getOTAChannelsByType;
export const getChannelMetadata = getOTAChannelConfig;