'use client'

import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'

export default function QRScanner({ onScan, onError, scanning }) {
  const [cameraId, setCameraId] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    if (!scanning) {
      // Stop scanning when scanning is false
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
      return
    }

    const html5QrCode = new Html5Qrcode('qr-scanner')
    html5QrCodeRef.current = html5QrCode

    // Request camera permission
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setCameraId(devices[0].id)
          setHasPermission(true)
          
          // Start scanning
          html5QrCode.start(
            devices[0].id,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // QR code scanned
              onScan(decodedText)
              // Stop scanning after successful scan
              html5QrCode.stop().catch(() => {})
            },
            (errorMessage) => {
              // Ignore errors (continuous scanning)
            }
          )
        } else {
          setHasPermission(false)
          onError(new Error('No camera found'))
        }
      })
      .catch(err => {
        setHasPermission(false)
        onError(new Error('Camera access denied'))
      })

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [scanning, onScan, onError])

  if (hasPermission === false) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-medium">Camera access denied</p>
        <p className="text-sm text-red-500 mt-2">
          Please enable camera permissions to scan QR codes
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div id="qr-scanner" className="w-full aspect-square bg-black rounded-lg"></div>
      {scanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-primary-ui rounded-lg w-64 h-64"></div>
        </div>
      )}
    </div>
  )
}

