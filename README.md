# 🔗 [mProtocol](https://majestorg.github.io/mProtocol/)

> **P2P messenger with a "M-Link" architecture.**

---

<table>

  <tr>
    <td width="60%" valign="top">
      <h2>⚡ О проекте</h2>
      <p><b>mProtocol</b> — это приватный мессенджер, построенный на технологии WebRTC.</p>
      <p align="left">
        <img src="https://img.shields.io/badge/Status-Stable-success" alt="Status"> 
        <img src="https://img.shields.io/badge/Architecture-P2P--Only-blue" alt="Architecture">
        <img src="https://img.shields.io/badge/Security-E2EE-orange" alt="Security">
      </p>
    </td>
    <td width="40%" rowspan="2" align="center" valign="middle">
      <img 
        src="https://github.com/user-attachments/assets/89783bd5-5bcd-4b9f-8761-8700429e5645"
        alt="mProtocol UI"
        style="max-width: 100%; height: auto; width: 340px; border-radius: 8px;" />
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h2>🛠 Технический стек "M-Link"</h2>
      <table width="100%">
        <tr><td><b>Protocol</b></td><td><code>WebRTC</code></td></tr>
        <tr><td><b>Signaling</b></td><td><code>Render.com</code></td></tr>
        <tr><td><b>STUN</b></td><td><code>Google Public STUN</code></td></tr>
        <tr><td><b>TURN</b></td><td><code>OpenRelay TURN</code></td></tr>
      </table>
    </td>
  </tr>
</table>

---

## 🧠 Логика работы

> [!IMPORTANT]
> **Zero-Server Storage**: Сообщения передаются напрямую между браузерами. Данные не сохраняются на сервере и не записываются в базу данных.

* **P2P Data Channel**: Прямой канал передачи данных между браузерами.
* **Signal Isolation**: Сигнальный сокет автоматически отключается после установки P2P-моста, исключая лишнюю нагрузку и повышая уровень приватности.
* **Latency Monitoring**: Встроенный счетчик задержки соединения в реальном времени.
* **Session Security**: Доступ по временному **6-значному коду**, который генерируется "на лету".

---

## 📂 Развертывание и Безопасность

- [x] **Standalone**: Проект реализован как **Single-File Application** (HTML/JS/CSS).
- [x] **Simple Deployment**: Хостинг фронтенда на GitHub Pages.
- [x] **Encryption**: Весь трафик зашифрован "из коробки" стеком WebRTC (DTLS/SRTP).

---


<br/>

<p align="center">
  <sub>© 2026 // <b>Engineered by Matvey</b></sub>
</p>
