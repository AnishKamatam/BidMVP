'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('login')
  const { user, signOut } = useAuth()

  const openLoginModal = () => {
    setModalMode('login')
    setModalOpen(true)
  }

  const openSignupModal = () => {
    setModalMode('signup')
    setModalOpen(true)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <main className="h-screen w-screen bg-white flex flex-col">
      {/* Blank space taking up most of the screen */}
      <div className="flex-1 flex items-center justify-center">
        {user && (
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Welcome!</p>
            <p className="text-gray-600 mb-4">{user.email}</p>
            <button
              onClick={handleSignOut}
              className="bg-black text-white px-6 py-3 font-semibold hover:bg-gray-900 active:bg-gray-800 transition-all"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
      
      {/* Bottom buttons container - only show if not logged in */}
      {!user && (
        <div className="w-full px-8 pb-10 safe-area-bottom">
          <div className="flex gap-4">
            <button
              onClick={openLoginModal}
              className="flex-1 bg-white text-black py-4 border-2 border-black font-semibold text-base hover:bg-gray-50 active:bg-gray-100 transition-all"
            >
              Log In
            </button>
            <button
              onClick={openSignupModal}
              className="flex-1 bg-black text-white py-4 border-2 border-black font-semibold text-base hover:bg-gray-900 active:bg-gray-800 transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </main>
  )
}

