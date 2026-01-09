package wireguard

import (
	"bytes"
	"os/exec"
	"strings"
)

// GenerateKeys generates a new WireGuard private and public key pair using the 'wg' command-line tool.
func GenerateKeys() (privateKey string, publicKey string, err error) {
	// Generate Private Key
	cmdGenKey := exec.Command("wg", "genkey")
	var outPriv bytes.Buffer
	cmdGenKey.Stdout = &outPriv
	if err := cmdGenKey.Run(); err != nil {
		return "", "", err
	}
	privateKey = strings.TrimSpace(outPriv.String())

	// Generate Public Key
	cmdPubKey := exec.Command("wg", "pubkey")
	cmdPubKey.Stdin = strings.NewReader(privateKey)
	var outPub bytes.Buffer
	cmdPubKey.Stdout = &outPub
	if err := cmdPubKey.Run(); err != nil {
		return "", "", err
	}
	publicKey = strings.TrimSpace(outPub.String())

	return privateKey, publicKey, nil
}
