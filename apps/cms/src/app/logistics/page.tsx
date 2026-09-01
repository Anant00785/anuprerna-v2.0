/**
 * /logistics — Logistics hub (server entry point).
 *
 * Pure client-shell page; data loads client-side via the /api/loom proxy, so no
 * force-dynamic is needed on this shell.
 */
import React from 'react'
import { LogisticsClient } from './LogisticsClient'

export default function LogisticsPage() {
  return <LogisticsClient />
}
