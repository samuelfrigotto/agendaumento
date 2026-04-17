`#!/usr/bin/env bash`
echo "Exercicio 2.3.1"

set -euo pipefail

read -p "Deseja limpar o cache antes de continuar? (s/n)" 
 
echo "$VARINEZ"

if [ "$REPLY" == 's' ]; then
    echo "Limpando o cache..."
else
    echo "Seguindo em frente..."
fi


