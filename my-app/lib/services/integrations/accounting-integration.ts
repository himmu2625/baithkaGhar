import axios from 'axios'
import crypto from 'crypto'

export interface AccountingCredentials {
  accessToken: string
  refreshToken?: string
  realmId?: string
  tenantId?: string
  clientId?: string
  clientSecret?: string
  apiUrl?: string
  companyId?: string
}

export interface Invoice {
  id?: string
  customerName: string
  customerEmail?: string
  invoiceNumber?: string
  issueDate: Date
  dueDate: Date
  lineItems: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
    taxRate?: number
    accountCode?: string
  }>
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  propertyId?: string
  reservationId?: string
}

export interface Payment {
  id?: string
  invoiceId: string
  amount: number
  paymentDate: Date
  paymentMethod: string
  reference?: string
  currency: string
}

export interface ChartOfAccounts {
  revenueAccount: string
  taxAccount: string
  depositAccount: string
  refundAccount: string
}

export interface AccountingSyncResult {
  success: boolean
  invoicesCreated?: number
  paymentsRecorded?: number
  errors?: string[]
  externalIds?: { [localId: string]: string }
}

export class AccountingIntegrationService {
  static async syncQuickBooksInvoices(
    credentials: AccountingCredentials,
    invoices: Invoice[],
    chartOfAccounts: ChartOfAccounts
  ): Promise<AccountingSyncResult> {
    try {
      const result: AccountingSyncResult = {
        success: true,
        errors: [],
        externalIds: {},
        invoicesCreated: 0
      }

      for (const invoice of invoices) {
        try {
          const customer = await this.findOrCreateQuickBooksCustomer(
            credentials,
            invoice.customerName,
            invoice.customerEmail
          )

          const qbInvoice = {
            Line: invoice.lineItems.map((item, index) => ({
              Id: (index + 1).toString(),
              LineNum: index + 1,
              Amount: item.amount,
              DetailType: 'SalesItemLineDetail',
              SalesItemLineDetail: {
                ItemRef: { value: '1', name: 'Services' },
                UnitPrice: item.rate,
                Qty: item.quantity,
                TaxCodeRef: item.taxRate ? { value: '3' } : { value: 'NON' }
              }
            })),
            CustomerRef: { value: customer.id },
            TxnDate: invoice.issueDate.toISOString().split('T')[0],
            DueDate: invoice.dueDate.toISOString().split('T')[0],
            DocNumber: invoice.invoiceNumber,
            TotalAmt: invoice.totalAmount,
            CurrencyRef: { value: invoice.currency }
          }

          const response = await axios.post(
            `${credentials.apiUrl}/v3/company/${credentials.realmId}/invoice`,
            qbInvoice,
            {
              headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            }
          )

          if (response.data.QueryResponse?.Invoice?.[0]) {
            result.externalIds![invoice.id || ''] = response.data.QueryResponse.Invoice[0].Id
            result.invoicesCreated!++
          }
        } catch (error) {
          result.errors?.push(`Invoice creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`QuickBooks sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async syncXeroInvoices(
    credentials: AccountingCredentials,
    invoices: Invoice[],
    chartOfAccounts: ChartOfAccounts
  ): Promise<AccountingSyncResult> {
    try {
      const result: AccountingSyncResult = {
        success: true,
        errors: [],
        externalIds: {},
        invoicesCreated: 0
      }

      for (const invoice of invoices) {
        try {
          const contact = await this.findOrCreateXeroContact(
            credentials,
            invoice.customerName,
            invoice.customerEmail
          )

          const xeroInvoice = {
            Type: 'ACCREC',
            Contact: { ContactID: contact.id },
            Date: invoice.issueDate.toISOString().split('T')[0],
            DueDate: invoice.dueDate.toISOString().split('T')[0],
            InvoiceNumber: invoice.invoiceNumber,
            CurrencyCode: invoice.currency,
            Status: invoice.status === 'draft' ? 'DRAFT' : 'SUBMITTED',
            LineItems: invoice.lineItems.map(item => ({
              Description: item.description,
              Quantity: item.quantity,
              UnitAmount: item.rate,
              AccountCode: item.accountCode || chartOfAccounts.revenueAccount,
              TaxType: item.taxRate ? 'OUTPUT' : 'NONE'
            }))
          }

          const response = await axios.post(
            `${credentials.apiUrl || 'https://api.xero.com'}/api.xro/2.0/Invoices`,
            { Invoices: [xeroInvoice] },
            {
              headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'xero-tenant-id': credentials.tenantId,
                'Content-Type': 'application/json'
              }
            }
          )

          if (response.data.Invoices?.[0]) {
            result.externalIds![invoice.id || ''] = response.data.Invoices[0].InvoiceID
            result.invoicesCreated!++
          }
        } catch (error) {
          result.errors?.push(`Invoice creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`Xero sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async syncWaveInvoices(
    credentials: AccountingCredentials,
    invoices: Invoice[]
  ): Promise<AccountingSyncResult> {
    try {
      const result: AccountingSyncResult = {
        success: true,
        errors: [],
        externalIds: {},
        invoicesCreated: 0
      }

      for (const invoice of invoices) {
        try {
          const customer = await this.findOrCreateWaveCustomer(
            credentials,
            invoice.customerName,
            invoice.customerEmail
          )

          const waveInvoice = {
            customer: { id: customer.id },
            invoiceDate: invoice.issueDate.toISOString().split('T')[0],
            dueDate: invoice.dueDate.toISOString().split('T')[0],
            invoiceNumber: invoice.invoiceNumber,
            currency: { code: invoice.currency },
            items: invoice.lineItems.map(item => ({
              product: {
                name: item.description,
                unitPrice: item.rate,
                defaultSalesTax: item.taxRate ? { rate: item.taxRate } : null
              },
              quantity: item.quantity,
              unitPrice: item.rate
            }))
          }

          const response = await axios.post(
            `${credentials.apiUrl || 'https://gql.waveapps.com'}/graphql/public`,
            {
              query: `
                mutation CreateInvoice($input: InvoiceCreateInput!) {
                  invoiceCreate(input: $input) {
                    invoice {
                      id
                      invoiceNumber
                    }
                    didSucceed
                    inputErrors {
                      message
                      path
                    }
                  }
                }
              `,
              variables: { input: waveInvoice }
            },
            {
              headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (response.data.data?.invoiceCreate?.didSucceed) {
            result.externalIds![invoice.id || ''] = response.data.data.invoiceCreate.invoice.id
            result.invoicesCreated!++
          }
        } catch (error) {
          result.errors?.push(`Invoice creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`Wave sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async recordPayments(
    systemName: 'quickbooks' | 'xero' | 'wave',
    credentials: AccountingCredentials,
    payments: Payment[]
  ): Promise<AccountingSyncResult> {
    switch (systemName) {
      case 'quickbooks':
        return await this.recordQuickBooksPayments(credentials, payments)
      case 'xero':
        return await this.recordXeroPayments(credentials, payments)
      case 'wave':
        return await this.recordWavePayments(credentials, payments)
      default:
        return {
          success: false,
          errors: ['Unsupported accounting system']
        }
    }
  }

  private static async recordQuickBooksPayments(
    credentials: AccountingCredentials,
    payments: Payment[]
  ): Promise<AccountingSyncResult> {
    const result: AccountingSyncResult = {
      success: true,
      errors: [],
      paymentsRecorded: 0
    }

    for (const payment of payments) {
      try {
        const qbPayment = {
          CustomerRef: { value: '1' },
          TotalAmt: payment.amount,
          TxnDate: payment.paymentDate.toISOString().split('T')[0],
          PaymentRefNum: payment.reference,
          Line: [{
            Amount: payment.amount,
            LinkedTxn: [{
              TxnId: payment.invoiceId,
              TxnType: 'Invoice'
            }]
          }]
        }

        await axios.post(
          `${credentials.apiUrl}/v3/company/${credentials.realmId}/payment`,
          qbPayment,
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        )

        result.paymentsRecorded!++
      } catch (error) {
        result.errors?.push(`Payment recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async recordXeroPayments(
    credentials: AccountingCredentials,
    payments: Payment[]
  ): Promise<AccountingSyncResult> {
    const result: AccountingSyncResult = {
      success: true,
      errors: [],
      paymentsRecorded: 0
    }

    for (const payment of payments) {
      try {
        const xeroPayment = {
          Invoice: { InvoiceID: payment.invoiceId },
          Account: { Code: '090' },
          Date: payment.paymentDate.toISOString().split('T')[0],
          Amount: payment.amount,
          Reference: payment.reference
        }

        await axios.post(
          `${credentials.apiUrl || 'https://api.xero.com'}/api.xro/2.0/Payments`,
          { Payments: [xeroPayment] },
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'xero-tenant-id': credentials.tenantId,
              'Content-Type': 'application/json'
            }
          }
        )

        result.paymentsRecorded!++
      } catch (error) {
        result.errors?.push(`Payment recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async recordWavePayments(
    credentials: AccountingCredentials,
    payments: Payment[]
  ): Promise<AccountingSyncResult> {
    const result: AccountingSyncResult = {
      success: true,
      errors: [],
      paymentsRecorded: 0
    }

    for (const payment of payments) {
      try {
        const wavePayment = {
          invoiceId: payment.invoiceId,
          date: payment.paymentDate.toISOString().split('T')[0],
          amount: payment.amount,
          note: payment.reference
        }

        await axios.post(
          `${credentials.apiUrl || 'https://gql.waveapps.com'}/graphql/public`,
          {
            query: `
              mutation RecordPayment($input: InvoicePaymentCreateInput!) {
                invoicePaymentCreate(input: $input) {
                  payment {
                    id
                  }
                  didSucceed
                }
              }
            `,
            variables: { input: wavePayment }
          },
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        result.paymentsRecorded!++
      } catch (error) {
        result.errors?.push(`Payment recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async findOrCreateQuickBooksCustomer(
    credentials: AccountingCredentials,
    name: string,
    email?: string
  ): Promise<{ id: string }> {
    try {
      const searchResponse = await axios.get(
        `${credentials.apiUrl}/v3/company/${credentials.realmId}/query?query=SELECT * FROM Customer WHERE Name='${name}'`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Accept': 'application/json'
          }
        }
      )

      if (searchResponse.data.QueryResponse?.Customer?.[0]) {
        return { id: searchResponse.data.QueryResponse.Customer[0].Id }
      }

      const createResponse = await axios.post(
        `${credentials.apiUrl}/v3/company/${credentials.realmId}/customer`,
        {
          Name: name,
          PrimaryEmailAddr: email ? { Address: email } : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      )

      return { id: createResponse.data.QueryResponse.Customer[0].Id }
    } catch (error) {
      throw new Error(`Failed to find/create QuickBooks customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async findOrCreateXeroContact(
    credentials: AccountingCredentials,
    name: string,
    email?: string
  ): Promise<{ id: string }> {
    try {
      const searchResponse = await axios.get(
        `${credentials.apiUrl || 'https://api.xero.com'}/api.xro/2.0/Contacts?where=Name="${name}"`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'xero-tenant-id': credentials.tenantId
          }
        }
      )

      if (searchResponse.data.Contacts?.[0]) {
        return { id: searchResponse.data.Contacts[0].ContactID }
      }

      const createResponse = await axios.post(
        `${credentials.apiUrl || 'https://api.xero.com'}/api.xro/2.0/Contacts`,
        {
          Contacts: [{
            Name: name,
            EmailAddress: email
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'xero-tenant-id': credentials.tenantId,
            'Content-Type': 'application/json'
          }
        }
      )

      return { id: createResponse.data.Contacts[0].ContactID }
    } catch (error) {
      throw new Error(`Failed to find/create Xero contact: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async findOrCreateWaveCustomer(
    credentials: AccountingCredentials,
    name: string,
    email?: string
  ): Promise<{ id: string }> {
    try {
      const createResponse = await axios.post(
        `${credentials.apiUrl || 'https://gql.waveapps.com'}/graphql/public`,
        {
          query: `
            mutation CreateCustomer($input: CustomerCreateInput!) {
              customerCreate(input: $input) {
                customer {
                  id
                  name
                }
                didSucceed
              }
            }
          `,
          variables: {
            input: {
              name: name,
              email: email
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return { id: createResponse.data.data.customerCreate.customer.id }
    } catch (error) {
      throw new Error(`Failed to create Wave customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async syncExpenses(
    systemName: 'quickbooks' | 'xero' | 'wave',
    credentials: AccountingCredentials,
    expenses: Array<{
      id?: string
      description: string
      amount: number
      date: Date
      category: string
      vendor?: string
      receipt?: string
      propertyId?: string
      currency: string
    }>
  ): Promise<AccountingSyncResult> {
    switch (systemName) {
      case 'quickbooks':
        return await this.syncQuickBooksExpenses(credentials, expenses)
      case 'xero':
        return await this.syncXeroExpenses(credentials, expenses)
      case 'wave':
        return await this.syncWaveExpenses(credentials, expenses)
      default:
        return {
          success: false,
          errors: ['Unsupported accounting system']
        }
    }
  }

  private static async syncQuickBooksExpenses(
    credentials: AccountingCredentials,
    expenses: any[]
  ): Promise<AccountingSyncResult> {
    const result: AccountingSyncResult = {
      success: true,
      errors: [],
      invoicesCreated: 0
    }

    for (const expense of expenses) {
      try {
        const qbExpense = {
          PaymentType: 'Cash',
          Account: { value: '35', name: 'Checking' },
          TotalAmt: expense.amount,
          TxnDate: expense.date.toISOString().split('T')[0],
          PrivateNote: expense.description,
          Line: [{
            Amount: expense.amount,
            DetailType: 'AccountBasedExpenseLineDetail',
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: '6', name: 'Office Expenses' }
            }
          }]
        }

        await axios.post(
          `${credentials.apiUrl}/v3/company/${credentials.realmId}/purchase`,
          qbExpense,
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        )

        result.invoicesCreated!++
      } catch (error) {
        result.errors?.push(`Expense sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async syncXeroExpenses(
    credentials: AccountingCredentials,
    expenses: any[]
  ): Promise<AccountingSyncResult> {
    const result: AccountingSyncResult = {
      success: true,
      errors: [],
      invoicesCreated: 0
    }

    for (const expense of expenses) {
      try {
        const xeroExpense = {
          Type: 'SPEND',
          Date: expense.date.toISOString().split('T')[0],
          Reference: expense.description,
          LineItems: [{
            Description: expense.description,
            UnitAmount: expense.amount,
            AccountCode: '400',
            TaxType: 'NONE'
          }]
        }

        await axios.post(
          `${credentials.apiUrl || 'https://api.xero.com'}/api.xro/2.0/BankTransactions`,
          { BankTransactions: [xeroExpense] },
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'xero-tenant-id': credentials.tenantId,
              'Content-Type': 'application/json'
            }
          }
        )

        result.invoicesCreated!++
      } catch (error) {
        result.errors?.push(`Expense sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private static async syncWaveExpenses(
    credentials: AccountingCredentials,
    expenses: any[]
  ): Promise<AccountingSyncResult> {
    const result: AccountingSyncResult = {
      success: true,
      errors: [],
      invoicesCreated: 0
    }

    for (const expense of expenses) {
      try {
        await axios.post(
          `${credentials.apiUrl || 'https://gql.waveapps.com'}/graphql/public`,
          {
            query: `
              mutation CreateExpense($input: MoneyTransactionCreateInput!) {
                moneyTransactionCreate(input: $input) {
                  transaction {
                    id
                  }
                  didSucceed
                }
              }
            `,
            variables: {
              input: {
                description: expense.description,
                amount: expense.amount,
                date: expense.date.toISOString().split('T')[0]
              }
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${credentials.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        result.invoicesCreated!++
      } catch (error) {
        result.errors?.push(`Expense sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  static async generateFinancialReports(
    systemName: 'quickbooks' | 'xero' | 'wave',
    credentials: AccountingCredentials,
    reportType: 'profit_loss' | 'balance_sheet' | 'cash_flow',
    dateRange: { start: Date; end: Date }
  ): Promise<{
    success: boolean
    report?: any
    error?: string
  }> {
    try {
      switch (systemName) {
        case 'quickbooks':
          return await this.generateQuickBooksReport(credentials, reportType, dateRange)
        case 'xero':
          return await this.generateXeroReport(credentials, reportType, dateRange)
        case 'wave':
          return await this.generateWaveReport(credentials, reportType, dateRange)
        default:
          return { success: false, error: 'Unsupported accounting system' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }
    }
  }

  private static async generateQuickBooksReport(
    credentials: AccountingCredentials,
    reportType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const reportMap: { [key: string]: string } = {
        profit_loss: 'ProfitAndLoss',
        balance_sheet: 'BalanceSheet',
        cash_flow: 'CashFlow'
      }

      const response = await axios.get(
        `${credentials.apiUrl}/v3/company/${credentials.realmId}/reports/${reportMap[reportType]}?start_date=${dateRange.start.toISOString().split('T')[0]}&end_date=${dateRange.end.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Accept': 'application/json'
          }
        }
      )

      return { success: true, report: response.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }
    }
  }

  private static async generateXeroReport(
    credentials: AccountingCredentials,
    reportType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const reportMap: { [key: string]: string } = {
        profit_loss: 'ProfitAndLoss',
        balance_sheet: 'BalanceSheet',
        cash_flow: 'CashSummary'
      }

      const response = await axios.get(
        `${credentials.apiUrl || 'https://api.xero.com'}/api.xro/2.0/Reports/${reportMap[reportType]}?fromDate=${dateRange.start.toISOString().split('T')[0]}&toDate=${dateRange.end.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'xero-tenant-id': credentials.tenantId
          }
        }
      )

      return { success: true, report: response.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }
    }
  }

  private static async generateWaveReport(
    credentials: AccountingCredentials,
    reportType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const response = await axios.post(
        `${credentials.apiUrl || 'https://gql.waveapps.com'}/graphql/public`,
        {
          query: `
            query GetReports($businessId: ID!, $fromDate: Date!, $toDate: Date!) {
              business(id: $businessId) {
                reports {
                  profitAndLoss(fromDate: $fromDate, toDate: $toDate) {
                    totalRevenue
                    totalExpenses
                    netIncome
                  }
                }
              }
            }
          `,
          variables: {
            businessId: credentials.companyId,
            fromDate: dateRange.start.toISOString().split('T')[0],
            toDate: dateRange.end.toISOString().split('T')[0]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return { success: true, report: response.data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      }
    }
  }

  static async syncTaxInfo(
    systemName: 'quickbooks' | 'xero' | 'wave',
    credentials: AccountingCredentials,
    taxTransactions: Array<{
      description: string
      amount: number
      taxType: string
      date: Date
    }>
  ): Promise<AccountingSyncResult> {
    const result: AccountingSyncResult = {
      success: true,
      errors: [],
      invoicesCreated: 0
    }

    try {
      switch (systemName) {
        case 'quickbooks':
          for (const tax of taxTransactions) {
            try {
              const taxItem = {
                Name: tax.description,
                Type: 'Service',
                QtyOnHand: { value: 0 },
                UnitPrice: tax.amount,
                IncomeAccountRef: { value: '82', name: 'Other Income' }
              }

              await axios.post(
                `${credentials.apiUrl}/v3/company/${credentials.realmId}/item`,
                taxItem,
                {
                  headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  }
                }
              )

              result.invoicesCreated!++
            } catch (error) {
              result.errors?.push(`Tax sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }
          break

        case 'xero':
        case 'wave':
          break
      }

      return result
    } catch (error) {
      return {
        success: false,
        errors: [`Tax sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  static async validateCredentials(
    systemName: 'quickbooks' | 'xero' | 'wave',
    credentials: AccountingCredentials
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      switch (systemName) {
        case 'quickbooks':
          await axios.get(
            `${credentials.apiUrl}/v3/company/${credentials.realmId}/companyinfo/${credentials.realmId}`,
            {
              headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Accept': 'application/json'
              }
            }
          )
          return { valid: true }

        case 'xero':
          await axios.get(
            `${credentials.apiUrl || 'https://api.xero.com'}/api.xro/2.0/Organisation`,
            {
              headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'xero-tenant-id': credentials.tenantId
              }
            }
          )
          return { valid: true }

        case 'wave':
          await axios.post(
            `${credentials.apiUrl || 'https://gql.waveapps.com'}/graphql/public`,
            {
              query: 'query { user { id } }'
            },
            {
              headers: {
                'Authorization': `Bearer ${credentials.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          )
          return { valid: true }

        default:
          return { valid: false, error: 'Unsupported accounting system' }
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }
    }
  }
}