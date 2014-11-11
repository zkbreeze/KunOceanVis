//
//  RayCastingRenderer2D.h
//
//
//  Created by Kun Zhao on 2014-11-10 17:33:28.
//
//

#ifndef KUN__RAYCASTINGRENDERER2D_H_INCLUDE
#define KUN__RAYCASTINGRENDERER2D_H_INCLUDE
 
#include <kvs/Module>
#include <kvs/VolumeRendererBase>
#include <kvs/Texture1D>
#include <kvs/Texture2D>
#include <kvs/Texture3D>
#include <kvs/FrameBufferObject>
#include <kvs/VertexBufferObject>
#include <kvs/ObjectBase>
#include <kvs/Camera>
#include <kvs/Light>
#include <kvs/StructuredVolumeObject>
#include <kvs/ProgramObject>
#include <kvs/ShaderSource>

namespace kun
{

class RayCastingRenderer2D : public kvs::VolumeRendererBase
{
    kvsModule( kun::RayCastingRenderer2D, Renderer );
    kvsModuleBaseClass( kvs::VolumeRendererBase );

public:

    enum DrawingBuffer
    {
        FrontFace,
        BackFace,
        Volume
    };

private:

    bool m_draw_front_face; ///< frag for drawing front face
    bool m_draw_back_face; ///< frag for drawing back face
    bool m_draw_volume; ///< frag for drawing volume
    bool m_enable_jittering; ///< frag for stochastic jittering
    float m_step; ///< sampling step
    float m_opaque; ///< opaque value for early ray termination
    kvs::Texture2D m_transfer_function_texture; ///< transfer function texture
    kvs::Texture2D m_jittering_texture; ///< texture for stochastic jittering
    kvs::Texture2D m_entry_texture; ///< entry point texture
    kvs::Texture2D m_exit_texture; ///< exit point texture
    kvs::Texture2D m_color_texture; ///< texture for color buffer
    kvs::Texture2D m_depth_texture; ///< texture for depth buffer
    kvs::Texture3D m_volume_texture; ///< volume data (3D texture)
    kvs::FrameBufferObject m_entry_exit_framebuffer; ///< framebuffer object for entry/exit point texture
    kvs::VertexBufferObject m_bounding_cube_buffer; ///< bounding cube (VBO)
    kvs::ProgramObject m_ray_casting_shader; ///< ray casting shader
    kvs::ProgramObject m_bounding_cube_shader; ///< bounding cube shader

    kvs::TransferFunction m_tfunc2d;
    kvs::StructuredVolumeObject* m_volume_2;
    kvs::Texture3D m_volume_texture_2;

public:

    RayCastingRenderer2D();
    RayCastingRenderer2D( const kvs::TransferFunction& tfunc );
    template <typename ShadingType>
    RayCastingRenderer2D( const ShadingType shader );

    void exec( kvs::ObjectBase* object, kvs::Camera* camera, kvs::Light* light );
    void setDrawingBuffer( const DrawingBuffer drawing_buffer );
    void setTransferFunction( kvs::TransferFunction& tfunc );
    void setSamplingStep( const float step ) { m_step = step; }
    void setOpaqueValue( const float opaque ) { m_opaque = opaque; }
    void enableJittering() { m_enable_jittering = true; }
    void disableJittering() { m_enable_jittering = false; }

    void setSecondVolume( kvs::StructuredVolumeObject* volume ) { m_volume_2 = volume; }

private:

    void initialize_shader( const kvs::StructuredVolumeObject* volume );
    void initialize_jittering_texture();
    void initialize_bounding_cube_buffer( const kvs::StructuredVolumeObject* volume );
    void initialize_transfer_function_texture();
    void initialize_volume_texture( const kvs::StructuredVolumeObject* volume, kvs::Texture3D& texture );
    void initialize_framebuffer( const size_t width, const size_t height );
    void update_framebuffer( const size_t width, const size_t height );
    void draw_bounding_cube_buffer();
    void draw_quad( const float opacity );
};

} // end of namespace kun
 
#endif // KUN__RAYCASTINGRENDERER2D_H_INCLUDE