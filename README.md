# vino-node-red-nodes
## Installation
In order to use the Netconf Driver node, you must copy the contents of /src/main/javascript into the path that your Node-RED installation expects you to install nodes, and issue the command `npm install`

Once you have installed the node, you must additionally make the contents of /src/main/javascript/lib/ui available via a web server. By default the node is expecting the script to be available at `/node-red/lib/ui/UI-Utilities.js`.

If you elect to serve the javascript file elsewhere, you must edit the

```<script type="application/javascript" src="/node-red/lib/ui/UI-Utilities.js"></script>```

 line in vino-netconf-driver.html to reflect the full URL that a web browser would be able to access the script from.
