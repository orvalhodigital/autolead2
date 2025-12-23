
/**
 * Redimensiona e recorta uma imagem para o tamanho especificado (cover).
 * @param file Arquivo de imagem original
 * @param width Largura desejada
 * @param height Altura desejada
 * @returns Promise com o Blob da imagem processada
 */
export const resizeImage = (file: File, width: number, height: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Não foi possível obter contexto do canvas'));
                return;
            }

            // Calcular dimensões para "object-fit: cover"
            const scale = Math.max(width / img.width, height / img.height);
            const dWidth = img.width * scale;
            const dHeight = img.height * scale;

            const dx = (width - dWidth) / 2;
            const dy = (height - dHeight) / 2;

            ctx.drawImage(img, dx, dy, dWidth, dHeight);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Erro ao processar imagem'));
                }
            }, 'image/jpeg', 0.9); // Quality 0.9
        };

        img.onerror = (err) => reject(err);
    });
};
