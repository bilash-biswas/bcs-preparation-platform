// components/hydration-fix.tsx
'use client'

import { useEffect } from 'react'

export function HydrationFix() {
  useEffect(() => {
    // Remove Grammarly and other extension attributes that cause hydration mismatch
    const removeExtensionAttributes = () => {
      if (typeof window !== 'undefined') {
        // Remove Grammarly attributes
        document.body.removeAttribute('data-new-gr-c-s-check-loaded')
        document.body.removeAttribute('data-gr-ext-installed')
        
        // Remove other common extension attributes
        const attributesToRemove = [
          'data-gramm',
          'data-gramm_editor',
          'data-enabled-grammarly',
          'data-gramm_id'
        ]
        
        attributesToRemove.forEach(attr => {
          document.body.removeAttribute(attr)
        })

        // Remove from all elements
        document.querySelectorAll('*').forEach(element => {
          attributesToRemove.forEach(attr => {
            element.removeAttribute(attr)
          })
        })
      }
    }

    removeExtensionAttributes()

    // Also clean up on route changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          removeExtensionAttributes()
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-new-gr-c-s-check-loaded', 'data-gr-ext-installed', 'data-gramm']
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}