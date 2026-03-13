import { LazyImage } from "@/components/lazy-image";

interface ImageItem {
	_id: string;
	url?: string | null;
	caption?: string;
	fileName?: string;
	aspectRatio?: number;
}

interface ImageGalleryProps {
	images: ImageItem[];
	onImageClick?: (image: ImageItem) => void;
}

export function ImageGallery({ images, onImageClick }: ImageGalleryProps) {
	// Distribute images across 4 columns
	const columns: ImageItem[][] = [[], [], [], []];
	images.forEach((image, index) => {
		columns[index % 4].push(image);
	});

	return (
		<div className="relative flex w-full flex-col items-center justify-center">
			<div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
				{columns.map((columnImages, col) => (
					<div className="grid gap-4" key={col}>
						{columnImages.map((image) => {
							const ratio = image.aspectRatio || 1;

							return (
								<div
									key={image._id}
									onClick={() => onImageClick?.(image)}
									className="cursor-pointer transition-transform hover:scale-[1.02]"
								>
									<LazyImage
										alt={image.caption || image.fileName || "Image"}
										containerClassName="rounded-lg"
										inView={true}
										ratio={ratio}
										src={image.url || ""}
									/>
									{image.caption && (
										<p className="mt-2 text-sm text-muted-foreground">
											{image.caption}
										</p>
									)}
								</div>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}
