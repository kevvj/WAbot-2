const { default: makeWASocket, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys')
const sharp = require('sharp')
const qrcode = require('qrcode-terminal')



async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const sock = makeWASocket({ auth: state })

    sock.ev.on('connection.update', ({ qr }) => {
        if (qr) qrcode.generate(qr, { small: true })
    })


    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        if (msg.message.imageMessage && msg.message.imageMessage.caption === '!sticker') {
            const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: sock.logger })

            const stickerBuffer = await sharp(buffer)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp()
                .toBuffer()

            await sock.sendMessage(msg.key.remoteJid, {
                sticker: stickerBuffer
            })
        }
    })
}

start()
