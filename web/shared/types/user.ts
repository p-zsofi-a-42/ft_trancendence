export interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt?: string
  totpEnabled?: boolean
}

export interface UserPage {
  items: User[]
  total: number
  page: number
  pageSize: number
}