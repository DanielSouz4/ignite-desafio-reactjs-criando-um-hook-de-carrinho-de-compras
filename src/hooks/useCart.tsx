import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)

      if (!productExists) {
        const { data: product } = await api.get(`/products/${productId}`)
        const { data: stock } = await api.get(`/stock/${productId}`)

        if (stock.amount > 0) {
          setCart([...cart, { ...product, amount: 1 }])
          localStorage.setItem(
            '@RocketShoes:cart',
            JSON.stringify([...cart, { ...product, amount: 1 }])
          )
        }
      } else {
        const { data: product } = await api.get(`/products/${productId}`)
        const { data: stock } = await api.get(`/stock/${productId}`)

        if (stock.amount > productExists.amount) {
          const updateProductAmount = cart.map(product =>
            product.id === productId
              ? {
                  ...product,
                  amount: product.amount + 1
                }
              : product
          )
          setCart(updateProductAmount)
          localStorage.setItem(
            '@RocketShoes:cart',
            JSON.stringify(updateProductAmount)
          )
        } else {
          toast.error('Quantidade solicitada fora de estoque')
        }
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find(product => product.id === productId)

      if (productExist) {
        const productRemoved = cart.filter(product => product.id !== productId)
        setCart(productRemoved)
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(productRemoved)
        )
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const { data: stock } = await api.get(`/stock/${productId}`)

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const productExist = cart.find(product => product.id === productId)

      if (productExist) {
        const updateProductAmount = cart.map(product =>
          product.id === productId
            ? {
                ...product,
                amount: amount
              }
            : product
        )
        setCart(updateProductAmount)
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(updateProductAmount)
        )
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
