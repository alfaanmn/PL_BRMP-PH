'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabase() {
    const [result, setResult] = useState('Testing...')

    useEffect(() => {
        async function test() {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('bidangs')
                .select('id, nama')
                .limit(5)

            if (error) {
                setResult(`GAGAL: ${error.message}`)
                return
            }

            setResult(`BERHASIL: ${JSON.stringify(data, null, 2)}`)
        }

        test()
    }, [])

    return (
        <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Supabase Test</h1>
            <pre style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>{result}</pre>
        </main>
    )
}
