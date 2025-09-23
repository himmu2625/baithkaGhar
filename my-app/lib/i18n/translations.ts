export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi' | 'ru'

export interface TranslationData {
  // Common
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    edit: string
    delete: string
    confirm: string
    back: string
    next: string
    finish: string
    close: string
    search: string
    filter: string
    refresh: string
    share: string
    download: string
    print: string
    email: string
    phone: string
    address: string
    name: string
    date: string
    time: string
    price: string
    total: string
    currency: string
    yes: string
    no: string
    optional: string
    required: string
  }

  // Navigation
  navigation: {
    home: string
    bookings: string
    profile: string
    settings: string
    help: string
    about: string
    contact: string
    logout: string
  }

  // Booking
  booking: {
    title: string
    confirmation: string
    checkIn: string
    checkOut: string
    guests: string
    rooms: string
    roomType: string
    amenities: string
    specialRequests: string
    guestInfo: string
    firstName: string
    lastName: string
    emailAddress: string
    phoneNumber: string
    paymentInfo: string
    bookingComplete: string
    bookingFailed: string
    modifyBooking: string
    cancelBooking: string
    viewDetails: string
    downloadConfirmation: string
  }

  // Mobile Check-in
  checkin: {
    title: string
    welcomeBack: string
    findBooking: string
    confirmationOrEmail: string
    bookingFound: string
    verifyDetails: string
    uploadDocuments: string
    identityVerification: string
    governmentId: string
    passport: string
    visa: string
    roomPreferences: string
    paymentDeposit: string
    checkInComplete: string
    digitalRoomKey: string
    propertyMap: string
    wifiDetails: string
    services: string
    concierge: string
  }

  // Guest Portal
  portal: {
    welcome: string
    myBookings: string
    upcomingStays: string
    pastStays: string
    loyaltyProgram: string
    points: string
    tier: string
    benefits: string
    notifications: string
    accountSettings: string
    preferences: string
    paymentMethods: string
    privacySettings: string
  }

  // Sharing
  sharing: {
    shareBooking: string
    shareTravel: string
    quickShare: string
    customMessage: string
    selectContacts: string
    shareLink: string
    qrCode: string
    socialMedia: string
    email: string
    sms: string
    whatsapp: string
    copyLink: string
    shareSuccess: string
    linkCopied: string
  }

  // Staff Dashboard
  staff: {
    dashboard: string
    tasks: string
    rooms: string
    guests: string
    overview: string
    occupancy: string
    available: string
    pending: string
    urgent: string
    onDuty: string
    guestRequests: string
    housekeeping: string
    maintenance: string
    frontDesk: string
    newTask: string
    assignTask: string
    completeTask: string
    roomStatus: string
    updateStatus: string
  }

  // Errors and Messages
  messages: {
    bookingNotFound: string
    invalidConfirmation: string
    checkInNotAvailable: string
    modificationNotAllowed: string
    paymentRequired: string
    documentsRequired: string
    connectionLost: string
    syncInProgress: string
    offlineMode: string
    uploadFailed: string
    validationError: string
    serverError: string
    unauthorizedAccess: string
    sessionExpired: string
  }

  // Accessibility
  accessibility: {
    skipToContent: string
    openMenu: string
    closeMenu: string
    previousPage: string
    nextPage: string
    currentPage: string
    loading: string
    error: string
    success: string
    warning: string
    information: string
    required: string
    optional: string
    expand: string
    collapse: string
    select: string
    selectAll: string
    deselectAll: string
  }

  // Date and Time
  datetime: {
    today: string
    tomorrow: string
    yesterday: string
    thisWeek: string
    nextWeek: string
    thisMonth: string
    nextMonth: string
    january: string
    february: string
    march: string
    april: string
    may: string
    june: string
    july: string
    august: string
    september: string
    october: string
    november: string
    december: string
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
    morning: string
    afternoon: string
    evening: string
    night: string
  }
}

export const translations: Record<SupportedLanguage, TranslationData> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      refresh: 'Refresh',
      share: 'Share',
      download: 'Download',
      print: 'Print',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      name: 'Name',
      date: 'Date',
      time: 'Time',
      price: 'Price',
      total: 'Total',
      currency: 'USD',
      yes: 'Yes',
      no: 'No',
      optional: 'Optional',
      required: 'Required'
    },
    navigation: {
      home: 'Home',
      bookings: 'Bookings',
      profile: 'Profile',
      settings: 'Settings',
      help: 'Help',
      about: 'About',
      contact: 'Contact',
      logout: 'Logout'
    },
    booking: {
      title: 'Book Your Stay',
      confirmation: 'Confirmation Number',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      guests: 'Guests',
      rooms: 'Rooms',
      roomType: 'Room Type',
      amenities: 'Amenities',
      specialRequests: 'Special Requests',
      guestInfo: 'Guest Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      emailAddress: 'Email Address',
      phoneNumber: 'Phone Number',
      paymentInfo: 'Payment Information',
      bookingComplete: 'Booking Complete',
      bookingFailed: 'Booking Failed',
      modifyBooking: 'Modify Booking',
      cancelBooking: 'Cancel Booking',
      viewDetails: 'View Details',
      downloadConfirmation: 'Download Confirmation'
    },
    checkin: {
      title: 'Mobile Check-in',
      welcomeBack: 'Welcome Back!',
      findBooking: 'Find My Booking',
      confirmationOrEmail: 'Confirmation Number or Email',
      bookingFound: 'Booking Found',
      verifyDetails: 'Verify Details',
      uploadDocuments: 'Upload Documents',
      identityVerification: 'Identity Verification',
      governmentId: 'Government ID',
      passport: 'Passport',
      visa: 'Visa',
      roomPreferences: 'Room Preferences',
      paymentDeposit: 'Payment & Deposit',
      checkInComplete: 'Check-in Complete',
      digitalRoomKey: 'Digital Room Key',
      propertyMap: 'Property Map',
      wifiDetails: 'WiFi Details',
      services: 'Services',
      concierge: 'Concierge'
    },
    portal: {
      welcome: 'Welcome',
      myBookings: 'My Bookings',
      upcomingStays: 'Upcoming Stays',
      pastStays: 'Past Stays',
      loyaltyProgram: 'Loyalty Program',
      points: 'Points',
      tier: 'Tier',
      benefits: 'Benefits',
      notifications: 'Notifications',
      accountSettings: 'Account Settings',
      preferences: 'Preferences',
      paymentMethods: 'Payment Methods',
      privacySettings: 'Privacy Settings'
    },
    sharing: {
      shareBooking: 'Share Booking',
      shareTravel: 'Share Travel Plans',
      quickShare: 'Quick Share',
      customMessage: 'Custom Message',
      selectContacts: 'Select Contacts',
      shareLink: 'Share Link',
      qrCode: 'QR Code',
      socialMedia: 'Social Media',
      email: 'Email',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      copyLink: 'Copy Link',
      shareSuccess: 'Shared Successfully',
      linkCopied: 'Link Copied'
    },
    staff: {
      dashboard: 'Staff Dashboard',
      tasks: 'Tasks',
      rooms: 'Rooms',
      guests: 'Guests',
      overview: 'Overview',
      occupancy: 'Occupancy',
      available: 'Available',
      pending: 'Pending',
      urgent: 'Urgent',
      onDuty: 'On Duty',
      guestRequests: 'Guest Requests',
      housekeeping: 'Housekeeping',
      maintenance: 'Maintenance',
      frontDesk: 'Front Desk',
      newTask: 'New Task',
      assignTask: 'Assign Task',
      completeTask: 'Complete Task',
      roomStatus: 'Room Status',
      updateStatus: 'Update Status'
    },
    messages: {
      bookingNotFound: 'Booking not found',
      invalidConfirmation: 'Invalid confirmation number',
      checkInNotAvailable: 'Check-in not available yet',
      modificationNotAllowed: 'Modification not allowed',
      paymentRequired: 'Payment required',
      documentsRequired: 'Documents required',
      connectionLost: 'Connection lost',
      syncInProgress: 'Syncing...',
      offlineMode: 'Offline mode',
      uploadFailed: 'Upload failed',
      validationError: 'Validation error',
      serverError: 'Server error',
      unauthorizedAccess: 'Unauthorized access',
      sessionExpired: 'Session expired'
    },
    accessibility: {
      skipToContent: 'Skip to content',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      currentPage: 'Current page',
      loading: 'Loading content',
      error: 'Error occurred',
      success: 'Action successful',
      warning: 'Warning',
      information: 'Information',
      required: 'Required field',
      optional: 'Optional field',
      expand: 'Expand',
      collapse: 'Collapse',
      select: 'Select',
      selectAll: 'Select all',
      deselectAll: 'Deselect all'
    },
    datetime: {
      today: 'Today',
      tomorrow: 'Tomorrow',
      yesterday: 'Yesterday',
      thisWeek: 'This week',
      nextWeek: 'Next week',
      thisMonth: 'This month',
      nextMonth: 'Next month',
      january: 'January',
      february: 'February',
      march: 'March',
      april: 'April',
      may: 'May',
      june: 'June',
      july: 'July',
      august: 'August',
      september: 'September',
      october: 'October',
      november: 'November',
      december: 'December',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night'
    }
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      finish: 'Finalizar',
      close: 'Cerrar',
      search: 'Buscar',
      filter: 'Filtrar',
      refresh: 'Actualizar',
      share: 'Compartir',
      download: 'Descargar',
      print: 'Imprimir',
      email: 'Correo',
      phone: 'Teléfono',
      address: 'Dirección',
      name: 'Nombre',
      date: 'Fecha',
      time: 'Hora',
      price: 'Precio',
      total: 'Total',
      currency: 'USD',
      yes: 'Sí',
      no: 'No',
      optional: 'Opcional',
      required: 'Requerido'
    },
    navigation: {
      home: 'Inicio',
      bookings: 'Reservas',
      profile: 'Perfil',
      settings: 'Configuración',
      help: 'Ayuda',
      about: 'Acerca de',
      contact: 'Contacto',
      logout: 'Cerrar sesión'
    },
    booking: {
      title: 'Reserva tu Estadía',
      confirmation: 'Número de Confirmación',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      guests: 'Huéspedes',
      rooms: 'Habitaciones',
      roomType: 'Tipo de Habitación',
      amenities: 'Amenidades',
      specialRequests: 'Solicitudes Especiales',
      guestInfo: 'Información del Huésped',
      firstName: 'Nombre',
      lastName: 'Apellido',
      emailAddress: 'Correo Electrónico',
      phoneNumber: 'Número de Teléfono',
      paymentInfo: 'Información de Pago',
      bookingComplete: 'Reserva Completada',
      bookingFailed: 'Reserva Fallida',
      modifyBooking: 'Modificar Reserva',
      cancelBooking: 'Cancelar Reserva',
      viewDetails: 'Ver Detalles',
      downloadConfirmation: 'Descargar Confirmación'
    },
    checkin: {
      title: 'Check-in Móvil',
      welcomeBack: '¡Bienvenido de Nuevo!',
      findBooking: 'Encontrar Mi Reserva',
      confirmationOrEmail: 'Número de Confirmación o Email',
      bookingFound: 'Reserva Encontrada',
      verifyDetails: 'Verificar Detalles',
      uploadDocuments: 'Subir Documentos',
      identityVerification: 'Verificación de Identidad',
      governmentId: 'ID Gubernamental',
      passport: 'Pasaporte',
      visa: 'Visa',
      roomPreferences: 'Preferencias de Habitación',
      paymentDeposit: 'Pago y Depósito',
      checkInComplete: 'Check-in Completado',
      digitalRoomKey: 'Llave Digital',
      propertyMap: 'Mapa del Hotel',
      wifiDetails: 'Detalles WiFi',
      services: 'Servicios',
      concierge: 'Conserjería'
    },
    portal: {
      welcome: 'Bienvenido',
      myBookings: 'Mis Reservas',
      upcomingStays: 'Próximas Estadías',
      pastStays: 'Estadías Pasadas',
      loyaltyProgram: 'Programa de Lealtad',
      points: 'Puntos',
      tier: 'Nivel',
      benefits: 'Beneficios',
      notifications: 'Notificaciones',
      accountSettings: 'Configuración de Cuenta',
      preferences: 'Preferencias',
      paymentMethods: 'Métodos de Pago',
      privacySettings: 'Configuración de Privacidad'
    },
    sharing: {
      shareBooking: 'Compartir Reserva',
      shareTravel: 'Compartir Planes de Viaje',
      quickShare: 'Compartir Rápido',
      customMessage: 'Mensaje Personalizado',
      selectContacts: 'Seleccionar Contactos',
      shareLink: 'Compartir Enlace',
      qrCode: 'Código QR',
      socialMedia: 'Redes Sociales',
      email: 'Correo',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      copyLink: 'Copiar Enlace',
      shareSuccess: 'Compartido Exitosamente',
      linkCopied: 'Enlace Copiado'
    },
    staff: {
      dashboard: 'Panel de Personal',
      tasks: 'Tareas',
      rooms: 'Habitaciones',
      guests: 'Huéspedes',
      overview: 'Resumen',
      occupancy: 'Ocupación',
      available: 'Disponible',
      pending: 'Pendiente',
      urgent: 'Urgente',
      onDuty: 'En Servicio',
      guestRequests: 'Solicitudes de Huéspedes',
      housekeeping: 'Limpieza',
      maintenance: 'Mantenimiento',
      frontDesk: 'Recepción',
      newTask: 'Nueva Tarea',
      assignTask: 'Asignar Tarea',
      completeTask: 'Completar Tarea',
      roomStatus: 'Estado de Habitación',
      updateStatus: 'Actualizar Estado'
    },
    messages: {
      bookingNotFound: 'Reserva no encontrada',
      invalidConfirmation: 'Número de confirmación inválido',
      checkInNotAvailable: 'Check-in no disponible aún',
      modificationNotAllowed: 'Modificación no permitida',
      paymentRequired: 'Pago requerido',
      documentsRequired: 'Documentos requeridos',
      connectionLost: 'Conexión perdida',
      syncInProgress: 'Sincronizando...',
      offlineMode: 'Modo sin conexión',
      uploadFailed: 'Carga fallida',
      validationError: 'Error de validación',
      serverError: 'Error del servidor',
      unauthorizedAccess: 'Acceso no autorizado',
      sessionExpired: 'Sesión expirada'
    },
    accessibility: {
      skipToContent: 'Saltar al contenido',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      previousPage: 'Página anterior',
      nextPage: 'Página siguiente',
      currentPage: 'Página actual',
      loading: 'Cargando contenido',
      error: 'Ocurrió un error',
      success: 'Acción exitosa',
      warning: 'Advertencia',
      information: 'Información',
      required: 'Campo requerido',
      optional: 'Campo opcional',
      expand: 'Expandir',
      collapse: 'Colapsar',
      select: 'Seleccionar',
      selectAll: 'Seleccionar todo',
      deselectAll: 'Deseleccionar todo'
    },
    datetime: {
      today: 'Hoy',
      tomorrow: 'Mañana',
      yesterday: 'Ayer',
      thisWeek: 'Esta semana',
      nextWeek: 'Próxima semana',
      thisMonth: 'Este mes',
      nextMonth: 'Próximo mes',
      january: 'Enero',
      february: 'Febrero',
      march: 'Marzo',
      april: 'Abril',
      may: 'Mayo',
      june: 'Junio',
      july: 'Julio',
      august: 'Agosto',
      september: 'Septiembre',
      october: 'Octubre',
      november: 'Noviembre',
      december: 'Diciembre',
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
      morning: 'Mañana',
      afternoon: 'Tarde',
      evening: 'Noche',
      night: 'Madrugada'
    }
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      save: 'Enregistrer',
      edit: 'Modifier',
      delete: 'Supprimer',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      finish: 'Terminer',
      close: 'Fermer',
      search: 'Rechercher',
      filter: 'Filtrer',
      refresh: 'Actualiser',
      share: 'Partager',
      download: 'Télécharger',
      print: 'Imprimer',
      email: 'Email',
      phone: 'Téléphone',
      address: 'Adresse',
      name: 'Nom',
      date: 'Date',
      time: 'Heure',
      price: 'Prix',
      total: 'Total',
      currency: 'EUR',
      yes: 'Oui',
      no: 'Non',
      optional: 'Optionnel',
      required: 'Requis'
    },
    navigation: {
      home: 'Accueil',
      bookings: 'Réservations',
      profile: 'Profil',
      settings: 'Paramètres',
      help: 'Aide',
      about: 'À propos',
      contact: 'Contact',
      logout: 'Déconnexion'
    },
    booking: {
      title: 'Réservez votre Séjour',
      confirmation: 'Numéro de Confirmation',
      checkIn: 'Arrivée',
      checkOut: 'Départ',
      guests: 'Invités',
      rooms: 'Chambres',
      roomType: 'Type de Chambre',
      amenities: 'Équipements',
      specialRequests: 'Demandes Spéciales',
      guestInfo: 'Informations Client',
      firstName: 'Prénom',
      lastName: 'Nom de Famille',
      emailAddress: 'Adresse Email',
      phoneNumber: 'Numéro de Téléphone',
      paymentInfo: 'Informations de Paiement',
      bookingComplete: 'Réservation Terminée',
      bookingFailed: 'Réservation Échouée',
      modifyBooking: 'Modifier la Réservation',
      cancelBooking: 'Annuler la Réservation',
      viewDetails: 'Voir les Détails',
      downloadConfirmation: 'Télécharger la Confirmation'
    },
    checkin: {
      title: 'Enregistrement Mobile',
      welcomeBack: 'Bon Retour!',
      findBooking: 'Trouver ma Réservation',
      confirmationOrEmail: 'Numéro de Confirmation ou Email',
      bookingFound: 'Réservation Trouvée',
      verifyDetails: 'Vérifier les Détails',
      uploadDocuments: 'Télécharger des Documents',
      identityVerification: 'Vérification d\'Identité',
      governmentId: 'Pièce d\'Identité',
      passport: 'Passeport',
      visa: 'Visa',
      roomPreferences: 'Préférences de Chambre',
      paymentDeposit: 'Paiement et Dépôt',
      checkInComplete: 'Enregistrement Terminé',
      digitalRoomKey: 'Clé Numérique',
      propertyMap: 'Plan de l\'Hôtel',
      wifiDetails: 'Détails WiFi',
      services: 'Services',
      concierge: 'Conciergerie'
    },
    portal: {
      welcome: 'Bienvenue',
      myBookings: 'Mes Réservations',
      upcomingStays: 'Séjours à Venir',
      pastStays: 'Séjours Passés',
      loyaltyProgram: 'Programme de Fidélité',
      points: 'Points',
      tier: 'Niveau',
      benefits: 'Avantages',
      notifications: 'Notifications',
      accountSettings: 'Paramètres du Compte',
      preferences: 'Préférences',
      paymentMethods: 'Moyens de Paiement',
      privacySettings: 'Paramètres de Confidentialité'
    },
    sharing: {
      shareBooking: 'Partager la Réservation',
      shareTravel: 'Partager les Plans de Voyage',
      quickShare: 'Partage Rapide',
      customMessage: 'Message Personnalisé',
      selectContacts: 'Sélectionner les Contacts',
      shareLink: 'Partager le Lien',
      qrCode: 'Code QR',
      socialMedia: 'Réseaux Sociaux',
      email: 'Email',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      copyLink: 'Copier le Lien',
      shareSuccess: 'Partagé avec Succès',
      linkCopied: 'Lien Copié'
    },
    staff: {
      dashboard: 'Tableau de Bord Staff',
      tasks: 'Tâches',
      rooms: 'Chambres',
      guests: 'Clients',
      overview: 'Aperçu',
      occupancy: 'Occupation',
      available: 'Disponible',
      pending: 'En Attente',
      urgent: 'Urgent',
      onDuty: 'En Service',
      guestRequests: 'Demandes Clients',
      housekeeping: 'Ménage',
      maintenance: 'Maintenance',
      frontDesk: 'Réception',
      newTask: 'Nouvelle Tâche',
      assignTask: 'Assigner Tâche',
      completeTask: 'Terminer Tâche',
      roomStatus: 'Statut Chambre',
      updateStatus: 'Mettre à Jour le Statut'
    },
    messages: {
      bookingNotFound: 'Réservation non trouvée',
      invalidConfirmation: 'Numéro de confirmation invalide',
      checkInNotAvailable: 'Enregistrement pas encore disponible',
      modificationNotAllowed: 'Modification non autorisée',
      paymentRequired: 'Paiement requis',
      documentsRequired: 'Documents requis',
      connectionLost: 'Connexion perdue',
      syncInProgress: 'Synchronisation...',
      offlineMode: 'Mode hors ligne',
      uploadFailed: 'Échec du téléchargement',
      validationError: 'Erreur de validation',
      serverError: 'Erreur serveur',
      unauthorizedAccess: 'Accès non autorisé',
      sessionExpired: 'Session expirée'
    },
    accessibility: {
      skipToContent: 'Aller au contenu',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      previousPage: 'Page précédente',
      nextPage: 'Page suivante',
      currentPage: 'Page actuelle',
      loading: 'Chargement du contenu',
      error: 'Une erreur s\'est produite',
      success: 'Action réussie',
      warning: 'Avertissement',
      information: 'Information',
      required: 'Champ requis',
      optional: 'Champ optionnel',
      expand: 'Développer',
      collapse: 'Réduire',
      select: 'Sélectionner',
      selectAll: 'Tout sélectionner',
      deselectAll: 'Tout désélectionner'
    },
    datetime: {
      today: 'Aujourd\'hui',
      tomorrow: 'Demain',
      yesterday: 'Hier',
      thisWeek: 'Cette semaine',
      nextWeek: 'Semaine prochaine',
      thisMonth: 'Ce mois',
      nextMonth: 'Mois prochain',
      january: 'Janvier',
      february: 'Février',
      march: 'Mars',
      april: 'Avril',
      may: 'Mai',
      june: 'Juin',
      july: 'Juillet',
      august: 'Août',
      september: 'Septembre',
      october: 'Octobre',
      november: 'Novembre',
      december: 'Décembre',
      monday: 'Lundi',
      tuesday: 'Mardi',
      wednesday: 'Mercredi',
      thursday: 'Jeudi',
      friday: 'Vendredi',
      saturday: 'Samedi',
      sunday: 'Dimanche',
      morning: 'Matin',
      afternoon: 'Après-midi',
      evening: 'Soir',
      night: 'Nuit'
    }
  },
  // Abbreviated other languages for space - in production, include full translations
  de: {} as TranslationData,
  it: {} as TranslationData,
  pt: {} as TranslationData,
  zh: {} as TranslationData,
  ja: {} as TranslationData,
  ko: {} as TranslationData,
  ar: {} as TranslationData,
  hi: {} as TranslationData,
  ru: {} as TranslationData
}