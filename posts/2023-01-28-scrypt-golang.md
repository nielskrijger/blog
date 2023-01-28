---
title: Storing scrypt hashes with Golang
description: How to store an scrypt hash with Golang?
date: 2023-01-28
permalink: /posts/2023-01-28/storing-scrypt-hashes-with-golang/index.html
tags:
- Scrypt
- Golang
layout: layouts/post.njk
---

Scrypt is a highly secure alternative to the widely-used BCrypt hashing algorithm. These types of algorithms use a set of parameters to generate a unique hash key from some input data. They are designed to be slow in order to thwart brute-force attacks. As hardware improves, the settings can be adjusted to make the algorithm even more resistant to cracking.

Bcrypt offers an added layer of convenience by including the algorithm settings within the output hash. This makes it simple to compare a string to any pre-existing Bcrypt hash, as the settings can be easily extracted from the Bcrypt hash itself. A Bcrypt hash has a specific format, as outlined below (https://en.wikipedia.org/wiki/Bcrypt):

```
$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW
 \/ \/ \____________________/\_____________________________/
  1  2           3                         4

1. Algorithm
2. Cost
3. Salt
4. Hash
```

The advantage of this approach is that the comparison function (e.g. `compare("password123", "$2a$12$R9h/cIPz0gi.URNN...")`) can extract all settings from the hash itself.

In contrast, the Scrypt algorithm does not store its settings within the generated hash. Instead, the settings must be stored separately, hardcoded, or concatenated to the hash manually.

Storing the settings separately can be cumbersome as Scrypt has five distinct values (salt, hash, iterations, block size, and parallelism factor). Hardcoding them is a short-term solution, but the point of these settings is to increase them over time as hardware improves to avoid brute-force attacks. When these settings do change, password migration requires both the old and new settings.

As a result, the most obvious solution is to concatenate all settings within the same field. The common approach to do this is using the following format:
```
16384$8$1$kytG1MHY1KU=$afc338d494dc89be40e3....018710f46
\___/ | | \__________/ \_______________________________/
  1   2 3      4                      5
  
1. Iterations
2. Block size
3. Parallism
4. Salt
5. Hash
```

The only information missing here is the algorithm itself, which could be useful if you would switch to a completely different algorithm like [Argon2](https://en.wikipedia.org/wiki/Argon2). To address this, I will add an additional prefix of `scrypt$...` to the hash in the example code below.

## Golang

```go
package password

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/scrypt"
)

const (
	SaltByteSize    = 16
	HashKeySize     = 32
	HashIterations  = 32768
	HashBlockSize   = 8
	HashParallelism = 1
)

var errInvalidPasswordHash = errors.New("password hash does not have the correct format")

func Hash(password string) (string, error) {
	// Generate salt
	salt := make([]byte, SaltByteSize)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generating password salt: %w", err)
	}

	// Generate password hash
	passwordHash, err := scrypt.Key([]byte(password), salt, HashIterations, HashBlockSize, HashParallelism, HashKeySize)
	if err != nil {
		return "", fmt.Errorf("generating password salt: %w", err)
	}

	// Concatenate algorithm settings and hash with $ (this is a common format for scrypt hashes)
	base64Password := base64.StdEncoding.EncodeToString(passwordHash)
	base64Salt := base64.StdEncoding.EncodeToString(salt)

	return fmt.Sprintf("scrypt$%d$%d$%d$%s$%s", HashIterations, HashBlockSize, HashParallelism, base64Salt, base64Password), nil
}

// Compare compares a given password to an existing scrypt password hash
func Compare(hash string, password string) (bool, error) {
	var n, r, p int
	var alg, originalHash, salt string

	if _, err := fmt.Sscanf(strings.ReplaceAll(hash, "$", " "), "%s %d %d %d %s %s", &alg, &n, &r, &p, &salt, &originalHash); err != nil {
		return false, errInvalidPasswordHash
	}

	hashBytes, err := base64.StdEncoding.DecodeString(originalHash)
	if err != nil {
		return false, fmt.Errorf("decoding password hash: %w", err)
	}

	saltBytes, err := base64.StdEncoding.DecodeString(salt)
	if err != nil {
		return false, fmt.Errorf("decoding salt: %w", err)
	}

	passwordHash, err := scrypt.Key([]byte(password), saltBytes, n, r, p, len(hashBytes))
	if err != nil {
		return false, fmt.Errorf("generating password salt: %w", err)
	}

	return bytes.Equal(hashBytes, passwordHash), nil
}
```

### Test files

```go
package password_test

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/wanthave/wanthave-api/internal/common/password"
)

func TestHash(t *testing.T) {
	hash, err := password.Hash("test")

	pieces := strings.Split(hash, "$")

	assert.Nil(t, err)
	assert.Equal(t, pieces[0], "scrypt")
	assert.Equal(t, pieces[1], "32768")
	assert.Equal(t, pieces[2], "8")
	assert.Equal(t, pieces[3], "1")
	assert.Len(t, pieces[4], 24)
	assert.Len(t, pieces[5], 44)
}

func TestCompare(t *testing.T) {
	tests := []struct {
		name     string
		hash     string
		password string
		want     bool
		wantErr  string
	}{
		{
			name:     "valid password",
			hash:     "scrypt$32768$8$1$LKkHIXDLzEg+veXGMaIz7g==$+mDXBabQpGsWyeRhk9vgZpPXJMyZ5Zg4I/+mBdzkUx0=",
			password: "test",
			want:     true,
			wantErr:  "",
		},
		{
			name:     "invalid password",
			hash:     "scrypt$32768$8$1$LKkHIXDLzEg+veXGMaIz7g==$+mDXBabQpGsWyeRhk9vgZpPXJMyZ5Zg4I/+mBdzkUx0=",
			password: "TEST",
			want:     false,
			wantErr:  "",
		},
		{
			name:     "valid algorithm settings",
			hash:     "scrypt$32768$4$1$LKkHIXDLzEg+veXGMaIz7g==$+mDXBabQpGsWyeRhk9vgZpPXJMyZ5Zg4I/+mBdzkUx0=",
			password: "test",
			want:     false,
		},
		{
			name:     "invalid base64 hash encoding",
			hash:     "scrypt$32768$4$1$LKkHIXDLzEg+veXGMaIz7g==$invalid^",
			password: "test",
			want:     false,
			wantErr:  "decoding password hash: illegal base64 data at input byte 7",
		},
		{
			name:     "invalid base64 salt encoding",
			hash:     "scrypt$32768$4$1$invalid^$+mDXBabQpGsWyeRhk9vgZpPXJMyZ5Zg4I/+mBdzkUx0=",
			password: "test",
			want:     false,
			wantErr:  "decoding salt: illegal base64 data at input byte 7",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, gotErr := password.Compare(tc.hash, tc.password)

			assert.Equal(t, got, tc.want)
			if tc.wantErr != "" {
				assert.EqualError(t, gotErr, tc.wantErr)
			} else {
				assert.Nil(t, gotErr)
			}
		})
	}
}
```