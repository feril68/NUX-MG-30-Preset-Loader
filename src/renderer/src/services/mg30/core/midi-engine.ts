export class MG30Engine {
  access: MIDIAccess | null = null
  input: MIDIInput | null = null
  output: MIDIOutput | null = null

  async setup(onStateChange: () => void): Promise<void> {
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: true })
      this.access.onstatechange = onStateChange
      this.autoConnect()
    } catch (err) {
      console.error('MIDI Access Denied', err)
    }
  }

  autoConnect(): void {
    if (!this.access) return
    const inputs = Array.from(this.access.inputs.values())
    const outputs = Array.from(this.access.outputs.values())

    this.input = inputs.find((i) => i.name?.includes('MG-30')) || null
    this.output = outputs.find((o) => o.name?.includes('MG-30')) || null
  }

  sendCC(cc: number, value: number): void {
    if (!this.output) return
    // 0xB0 = Control Change on Channel 1
    this.output.send([0xb0, cc, Math.min(127, Math.max(0, value))])
  }
}
