# 🔗 [mProtocol](https://majestorg.github.io/mProtocol/)
> [!IMPORTANT] 
> Вышел [Release V2](https://github.com/MAJESTORG/mProtocol/releases/tag/New_Release)

---

<table>

  <tr>
    <td width="50%" valign="top">
      <h2>⚡ О проекте</h2>
      <p><b>mProtocol</b> — это приватный мессенджер, построенный на технологии WebRTC.</p>
      <p align="left">
        <img src="https://img.shields.io/badge/Version-2.1-success" alt="Status"> 
        <img src="https://img.shields.io/badge/Status-Stable-blue" alt="Architecture">
        <img src="https://img.shields.io/badge/Tech-WebRTC-orange" alt="Security">
      </p>
    </td>
    <td width="50%" rowspan="2" align="center" valign="middle">
      <img 
        src="https://github.com/user-attachments/assets/1366e2d7-e2a5-4c88-82ab-815d882ffc0c"
        alt="mProtocol UI"
        style="max-width: 100%; height: auto; width: 500px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h2>🛠 Технический стек "M-Link"</h2>
      <table width="100%">
        <tr><td><b>Protocol</b></td><td><code>WebRTC</code></td></tr>
        <tr><td><b>Signaling</b></td><td><code>Render.com</code></td></tr>
        <tr><td><b>STUN</b></td><td><code>OpenRelay STUN</code></td></tr>
        <tr><td><b>TURN</b></td><td><code>Private OpenRelay TURN</code></td></tr>
      </table>
    </td>
  </tr>
</table>

---

## 🧠 Логика работы

> [!NOTE]
>* **Zero-Server Storage**: Сообщения передаются напрямую между браузерами. Данные не сохраняются на сервере и не записываются в базу данных.

* **P2P Data Channel**: Прямой канал передачи данных между браузерами.
* **Signal Isolation**: Сигнальный сокет автоматически отключается после установки P2P-моста.
* **Latency Monitoring**: Встроенный счетчик задержки соединения в реальном времени.
* **Session Security**: Доступ по временному **6-значному коду**, который генерируется "на лету".

---

## 📂 Развертывание и Безопасность

- [x] **Standalone**: Проект реализован как **Single-File Application** (HTML/JS/CSS).
- [x] **Simple Deployment**: Хостинг фронтенда на GitHub Pages.
- [x] **Encryption**: Весь трафик зашифрован "из коробки" стеком WebRTC (DTLS/SRTP).
- [x] **Quick Access**: 🚀 **[Открыть mProtocol](https://majestorg.github.io/mProtocol/)**

---

<br/>

<p align="center">
  <sub>© 2026 <b>Engineered by Matvey</b></sub>
</p>
