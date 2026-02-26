const DEBUG_MIDI = import.meta.env.VITE_DEBUG_MIDI === '1'

export class MG30Engine {
  access: MIDIAccess | null = null
  input: MIDIInput | null = null
  output: MIDIOutput | null = null
  private useSysex = true
  private nativeConnected = false
  private rediscoveryTimer: number | null = null
  private rediscoveryAttempts = 0
  private lastPortSnapshot = ''
  private readonly maxRediscoveryAttempts = 10
  private readonly rediscoveryIntervalMs = 1000

  get isConnected(): boolean {
    return !!this.output || this.nativeConnected
  }

  async setup(onStateChange: () => void): Promise<void> {
    try {
      await this.requestAccess()
      this.bindStateListener(onStateChange)
      this.autoConnect()
      onStateChange()
      this.ensureRediscovery(onStateChange)
      await this.tryNativeConnect()
      onStateChange()
    } catch (err) {
      console.error('MIDI Access Denied', err)
      await this.tryNativeConnect()
      onStateChange()
    }
  }

  private async requestAccess(): Promise<void> {
    this.access = await navigator.requestMIDIAccess({ sysex: this.useSysex })
  }

  private bindStateListener(onStateChange: () => void): void {
    if (!this.access) return
    this.access.onstatechange = () => {
      this.autoConnect()
      onStateChange()
      this.ensureRediscovery(onStateChange)
    }
  }

  private ensureRediscovery(onStateChange: () => void): void {
    if (this.isConnected) {
      this.stopRediscovery()
      return
    }

    if (this.rediscoveryTimer !== null) return

    this.rediscoveryAttempts = 0
    this.rediscoveryTimer = window.setInterval(async () => {
      if (this.isConnected) {
        this.stopRediscovery()
        return
      }

      this.rediscoveryAttempts += 1

      try {
        await this.requestAccess()
        this.bindStateListener(onStateChange)
        this.autoConnect()
        onStateChange()
      } catch (err) {
        console.error('MIDI rediscovery failed', err)
      }

      if ((this.input && this.output) || this.rediscoveryAttempts >= this.maxRediscoveryAttempts) {
        if (!this.input && !this.output && this.useSysex) {
          this.useSysex = false
          this.rediscoveryAttempts = 0
          if (DEBUG_MIDI) {
            console.warn('MIDI ports still empty with sysex=true, retrying with sysex=false')
          }
          return
        }

        if (!this.input && !this.output) {
          await this.tryNativeConnect()
          onStateChange()
        }

        this.stopRediscovery()
      }
    }, this.rediscoveryIntervalMs)
  }

  private stopRediscovery(): void {
    if (this.rediscoveryTimer !== null) {
      window.clearInterval(this.rediscoveryTimer)
      this.rediscoveryTimer = null
    }
  }

  autoConnect(): void {
    if (!this.access) return
    const inputs = Array.from(this.access.inputs.values())
    const outputs = Array.from(this.access.outputs.values())

    const snapshot = `in:${inputs.length}|out:${outputs.length}`
    if (DEBUG_MIDI && snapshot !== this.lastPortSnapshot) {
      this.lastPortSnapshot = snapshot
      console.log('MIDI Inputs:', inputs)
      console.log('MIDI Outputs:', outputs)
    }

    this.input = inputs.find((i) => i.state === 'connected' && i.name?.includes('MG-30')) || null
    this.output = outputs.find((o) => o.state === 'connected' && o.name?.includes('MG-30')) || null

    if (this.output) {
      this.nativeConnected = false
      this.stopRediscovery()
    }
  }

  private async tryNativeConnect(): Promise<void> {
    if (this.nativeConnected) return
    if (!window.api?.midi) return

    try {
      const targetCandidates = ['MG-30', 'MG30', 'NUX']

      for (const target of targetCandidates) {
        const result = await window.api.midi.connect(target)
        if (DEBUG_MIDI) {
          console.log('Native MIDI fallback:', { target, result })
        }

        if (result.connected) {
          this.nativeConnected = true
          this.stopRediscovery()
          return
        }
      }

      this.nativeConnected = false
    } catch (error) {
      console.error('Native MIDI fallback failed', error)
    }
  }

  sendCC(cc: number, value: number): void {
    const clampedValue = Math.min(127, Math.max(0, value))

    if (this.output) {
      this.output.send([0xb0, cc, clampedValue])
      return
    }

    if (this.nativeConnected && window.api?.midi) {
      window.api.midi.send([0xb0, cc, clampedValue])
    }
  }

  async sendSysEx(data: number[]): Promise<void> {
    if (this.output) {
      const canUseWebSysex = !!this.access?.sysexEnabled

      if (canUseWebSysex) {
        try {
          this.output.send(data)
          return
        } catch (error) {
          console.error('Failed to send SysEx over Web MIDI', error)
        }
      } else if (DEBUG_MIDI) {
        console.warn('Web MIDI output connected without SysEx permission, trying native fallback')
      }
    }

    await this.tryNativeConnect()

    if (this.nativeConnected && window.api?.midi) {
      window.api.midi.send(data)
      return
    }

    if (DEBUG_MIDI) {
      console.error('SysEx send failed: no available MIDI transport')
    }
  }
}
