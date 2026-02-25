import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, Check, RotateCcw } from 'lucide-react'

interface ImageCropModalProps {
  file: File
  onCropComplete: (croppedFile: File) => void
  onCancel: () => void
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export function ImageCropModal({ file, onCropComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageUrl, setImageUrl] = useState<string>('')
  const [aspect, setAspect] = useState<number | undefined>(16 / 10)
  const imgRef = useRef<HTMLImageElement>(null)

  // Load the image when component mounts
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect))
    } else {
      setCrop({
        unit: '%',
        width: 90,
        height: 90,
        x: 5,
        y: 5,
      })
    }
  }, [aspect])

  const getCroppedImage = useCallback(async (): Promise<File | null> => {
    if (!imgRef.current || !completedCrop) return null

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, {
              type: file.type || 'image/jpeg',
            })
            resolve(croppedFile)
          } else {
            resolve(null)
          }
        },
        file.type || 'image/jpeg',
        0.95
      )
    })
  }, [completedCrop, file])

  const handleConfirm = async () => {
    const croppedFile = await getCroppedImage()
    if (croppedFile) {
      onCropComplete(croppedFile)
    }
  }

  const handleReset = () => {
    if (imgRef.current && aspect) {
      const { width, height } = imgRef.current
      setCrop(centerAspectCrop(width, height, aspect))
    }
  }

  const aspectOptions = [
    { label: '16:10', value: 16 / 10 },
    { label: '16:9', value: 16 / 9 },
    { label: '4:3', value: 4 / 3 },
    { label: '1:1', value: 1 },
    { label: 'Free', value: undefined },
  ]

  return (
    <div className="image-crop-modal-overlay" onClick={onCancel}>
      <div className="image-crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="image-crop-header">
          <h3>Crop Image</h3>
          <button className="image-crop-close" onClick={onCancel}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="image-crop-aspect-options">
          {aspectOptions.map((opt) => (
            <button
              key={opt.label}
              className={`aspect-option ${aspect === opt.value ? 'active' : ''}`}
              onClick={() => {
                setAspect(opt.value)
                if (imgRef.current && opt.value) {
                  const { width, height } = imgRef.current
                  setCrop(centerAspectCrop(width, height, opt.value))
                }
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="image-crop-container">
          {imageUrl && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="image-crop-area"
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="image-crop-preview"
              />
            </ReactCrop>
          )}
        </div>

        <div className="image-crop-actions">
          <button className="image-crop-reset" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <div className="image-crop-actions-right">
            <button className="image-crop-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="image-crop-confirm" onClick={handleConfirm}>
              <Check className="w-4 h-4" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
